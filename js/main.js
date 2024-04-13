const threadUnroll = {
    api: undefined,
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
                    //TODO: get the previous ones as well.
                    //Or at least show a proper warning to the user
                    window.alert("The Linked post isn't the first post in the thread.");
                }

                //TODO: Add option to log in for long threads
                //TODO: Add option to stitch together broken threads
                //TODO: Draw progress-bar or something to tell user something is happening.
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
        //TODO: make this look better.
        threadInfo.className = "threadInfo";
        threadInfo.innerHTML = statusArr.length + " Posts, Created: " + new Date(statusArr[0].created_at).toLocaleTimeString() + " " + new Date(statusArr[0].created_at).toLocaleDateString();
        userHeader.appendChild(threadInfo);

        mb.appendChild(userHeader);

        //Print all posts
        statusArr.forEach(status => {
            //Only list posts from OP.
            //TODO: add option to toggle this on or off
            if (statusArr[0].account.url == status.account.url) {
                var statusBox = document.createElement("section");
                statusBox.innerHTML = status.content;

                if (status.media_attachments) {
                    status.media_attachments.forEach(media => {
                        if (media.type == "image") {
                            var imgBox = document.createElement("figure");

                            var img = document.createElement("img");
                            img.alt = media.description;
                            img.src = media.url;
                            imgBox.appendChild(img);

                            var imgCaption = document.createElement("figcaption");
                            imgCaption.innerHTML = media.description;
                            imgBox.appendChild(imgCaption);

                            statusBox.appendChild(imgBox);
                        } else {
                            //TODO: handle other media types
                        }
                    });
                }

                mb.appendChild(statusBox);
            }
        });
    }
};

