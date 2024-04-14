const threadUnroll = {
    api: undefined,
    initPage: function () {
        var params = new URLSearchParams(window.location.search);
        if (params.size <= 1) {
            document.location = "../";
        } else {
            var instanceUri = params.get("uri");
            var statusID = params.get("id");

            if (instanceUri && statusID) {
                threadUnroll.initApi(instanceUri);
                threadUnroll.getAllStatuses(statusID, [], threadUnroll.drawstatuses);
            } else {
                document.location = "../";
            }
        }
    },
    initApi: function (instanceUri) {
        threadUnroll.api = new MastodonAPI({
            instance: instanceUri,
            api_user_token: ""
        });
    },
    getAllStatuses: function (statusID, previousStatusArr, callback) {
        if (previousStatusArr.length == 0) {
            //Get status first before getting the ancestors
            threadUnroll.api.get("statuses/" + statusID, {}, function (data) {
                previousStatusArr[0] = data;
                threadUnroll.getAllStatuses(statusID, previousStatusArr, callback);
            });
        } else {
            threadUnroll.api.get("statuses/" + statusID + "/context", {}, function (data) {
                if (data.ancestors.length > 0 && previousStatusArr.length == 0) {
                    //The given post wasn't the first one in the thread.
                    //maybe get the previous ones as well: https://github.com/RealDekkia/unroll-ninja/issues/5
                    //Or at least show a proper warning to the user
                    window.alert("The Linked post isn't the first post in the thread.");
                }

                if (data.descendants.length > 0) {
                    //There's more where this came from. Go get it.
                    previousStatusArr = previousStatusArr.concat(data.descendants);

                    var lastDescendantId = data.descendants[data.descendants.length - 1].id;
                    threadUnroll.getAllStatuses(lastDescendantId, previousStatusArr, callback);
                } else {
                    //All done, call callback
                    callback(previousStatusArr);
                }
            });
        }
    },
    drawstatuses: function (statusArr) {
        console.log(statusArr);
        var mb = document.getElementById("mainBody");
        mb.innerHTML = "";

        //Draw header with info about the user and the thread
        var userHeader = document.createElement("div");
        userHeader.className = "userHeader";
        userHeader.style.backgroundImage = "url(" + statusArr[0].account.header + ")";

        var username = document.createElement("a");
        username.className = "userName";
        username.innerHTML = statusArr[0].account.display_name;
        username.href = statusArr[0].account.url;
        userHeader.appendChild(username);

        if (statusArr[0].account.bot) {
            var isBot = document.createElement("mark");
            isBot.className = "userIsBot";
            isBot.innerHTML = "Bot";
            username.appendChild(isBot);
        }

        var userImg = document.createElement("img");
        userImg.className = "userImage";
        userImg.alt = "Profile picture of " + statusArr[0].account.display_name;
        userImg.src = statusArr[0].account.avatar;
        userHeader.appendChild(userImg);

        var threadInfo = document.createElement("span");

        var threadInfoPostCnt = document.createElement("span");
        threadInfoPostCnt.id = "threadInfoPostCnt";
        threadInfo.appendChild(threadInfoPostCnt);

        threadInfo.className = "threadInfo";
        threadInfo.innerHTML += ", Created: " + new Date(statusArr[0].created_at).toLocaleTimeString() + " " + new Date(statusArr[0].created_at).toLocaleDateString();
        userHeader.appendChild(threadInfo);

        mb.appendChild(userHeader);

        //Print all posts
        var postCnt = 0;
        statusArr.forEach(status => {
            //Only list posts from OP.
            if (statusArr[0].account.url == status.account.url) {
                var statusBox = document.createElement("section");
                statusBox.innerHTML = status.content;

                if (status.media_attachments) {
                    status.media_attachments.forEach(media => {

                        var mediaBox = document.createElement("figure");
                        var mediaContent = undefined;
                        if (media.type == "image") {
                            mediaContent = document.createElement("img");
                        } else if (media.type == "video" || media.type == "gifv") {
                            mediaContent = document.createElement("video");
                            mediaContent.setAttribute("controls", "");
                        } else if (media.type == "audio") {
                            mediaContent = document.createElement("audio");
                            mediaContent.setAttribute("controls", "");
                        }
                        if (mediaContent) {
                            mediaContent.alt = media.description;
                            mediaContent.src = media.url;
                            mediaBox.appendChild(mediaContent);
                        } else {
                            var errorMark = document.createElement("mark");
                            errorMark.innerHTML = "Unknown media type \"" + media.type + "\".";
                            mediaBox.appendChild(errorMark);
                        }

                        var mediaCaption = document.createElement("figcaption");
                        mediaCaption.innerHTML = media.description;
                        mediaBox.appendChild(mediaCaption);

                        statusBox.appendChild(mediaBox);
                    });
                }

                mb.appendChild(statusBox);
                postCnt++;
            }
        });

        document.getElementById("threadInfoPostCnt").innerHTML = postCnt;
        if (postCnt == 1) {
            document.getElementById("threadInfoPostCnt").innerHTML += " Post";
        } else {
            document.getElementById("threadInfoPostCnt").innerHTML += " Posts";
        }

    }
};

threadUnroll.initPage();