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
                threadUnroll.getAllStatuses(statusID, [], threadUnroll.drawstatuses, true, statusID);
            } else {
                document.location = "../";
            }
        }
    },
    initPageAsApi: function (instanceUri, statusID, callback) {
        if (instanceUri && statusID && callback) {
            threadUnroll.initApi(instanceUri);
            threadUnroll.getAllStatuses(statusID, [], function (x) {
                threadUnroll.drawstatuses(x, callback);
            }, true, statusID);
        }
    },
    initApi: function (instanceUri) {
        threadUnroll.api = new MastodonAPI({
            instance: instanceUri,
            api_user_token: ""
        });
    },
    getAllStatuses: function (statusID, previousStatusArr, callback, findStart, initStatusID) {
        if (previousStatusArr.length == 0 && findStart) {
            //Get status first before getting the ancestors
            threadUnroll.api.get("statuses/" + statusID, {}, function (data) {
                previousStatusArr[0] = data;

                //If the linked status is already the topmost, don't let it go upwards to begin with
                var continueFindStart = findStart;
                if (data.in_reply_to_id == null) continueFindStart = false;

                threadUnroll.getAllStatuses(statusID, previousStatusArr, callback, continueFindStart, initStatusID);
            });
        } else {
            threadUnroll.api.get("statuses/" + statusID + "/context", {}, function (data) {
                if (data.ancestors.length > 0 && findStart) {
                    //Given url wasn't the start of the thread
                    previousStatusArr = previousStatusArr.concat(data.ancestors);
                    var firstAncestorId = data.ancestors[0].id;

                    if (data.ancestors[0].in_reply_to_id == null) {
                        //Reached the top, go back down from where whe started from
                        threadUnroll.getAllStatuses(initStatusID, previousStatusArr, callback, false, initStatusID);
                    } else {
                        //go up more
                        threadUnroll.getAllStatuses(firstAncestorId, previousStatusArr, callback, true, initStatusID);
                    }
                }
                else if (data.descendants.length > 0 && !findStart) {
                    //There's more where this came from. Go get it.
                    previousStatusArr = previousStatusArr.concat(data.descendants);

                    var lastDescendantId = data.descendants[data.descendants.length - 1].id;
                    threadUnroll.getAllStatuses(lastDescendantId, previousStatusArr, callback, false, initStatusID);
                } else {
                    //Sort the resulting array based on the "in_reply_to_id"
                    //get the first element where "in_reply_to_id" is null
                    //And then work downwards by finding the one that replies to it
                    var sortedStatusArr = [];
                    previousStatusArr.forEach(status => {
                        if (status.in_reply_to_id == null) {
                            sortedStatusArr.push(status);
                            return;
                        }
                    });

                    var originalPoster = sortedStatusArr[0].account.id;
                    var failedFinds = 0;

                    while (sortedStatusArr.length + failedFinds < previousStatusArr.length) {
                        var previousStatus = sortedStatusArr[sortedStatusArr.length - 1];
                        if (previousStatus) {
                            var foundStatus = previousStatusArr.find(e => e.in_reply_to_id == previousStatus.id && e.account.id == originalPoster);
                            sortedStatusArr.push(foundStatus);
                        } else {
                            failedFinds++;
                        }

                    }
                    //All done, call callback
                    callback(sortedStatusArr);
                }
            });
        }
    },
    drawstatuses: function (statusArr, callback = false) {
        var mb;
        if (!callback) {
            var mb = document.getElementById("mainBody");
            mb.innerHTML = "";
        } else {
            mb = document.createElement("div");
        }

        if (!callback) {
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
            threadInfo.innerHTML += ", Created: " + new Date(statusArr[0].created_at).toLocaleString();
            userHeader.appendChild(threadInfo);

            mb.appendChild(userHeader);
        }

        //Print all posts
        var postCnt = 0;
        statusArr.forEach(status => {
            if (status === undefined) return;
            //Only list posts from OP.
            if (statusArr[0].account.url == status.account.url) {

                var statusBoxWrapper = document.createElement("a");
                statusBoxWrapper.className = "statusBoxWrapper";
                statusBoxWrapper.href = status.url;
                statusBoxWrapper.target = "_blank";
                statusBoxWrapper.rel = "noopener noreferrer";

                var statusBox = document.createElement("section");
                statusBoxWrapper.appendChild(statusBox);

                statusBox.innerHTML = status.content;

                if (status.media_attachments) {
                    status.media_attachments.forEach(media => {

                        var mediaBox = document.createElement("a");
                        mediaBox.className = "statusBoxWrapper";
                        mediaBox.href = media.url;
                        mediaBox.target = "_blank";
                        mediaBox.rel = "noopener noreferrer";

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

                if (status.card && status.card.image) {
                    var cardWrapper = document.createElement("a");
                    cardWrapper.className = "cardWrapper";
                    cardWrapper.href = status.card.url;

                    var cardImage = document.createElement("img");
                    cardImage.src = status.card.image;
                    cardWrapper.appendChild(cardImage);

                    var addedSubline = false;
                    if (status.card.provider_name && status.card.published_at) {
                        var cardImageSubline = document.createElement("p");
                        cardImageSubline.innerHTML = status.card.provider_name + " - " + new Date(status.card.published_at).toLocaleString();;
                        cardWrapper.appendChild(cardImageSubline);
                        addedSubline = true;
                    }

                    var cardHeadline = document.createElement("h4");
                    cardHeadline.innerHTML = status.card.title;
                    cardWrapper.appendChild(cardHeadline);

                    if (!addedSubline && status.card.description) {
                        var cardDescription = document.createElement("p");
                        cardDescription.innerHTML = status.card.description;
                        cardWrapper.appendChild(cardDescription);
                    }

                    if (status.card.author_name) {
                        var cardAutor = document.createElement("p");
                        cardAutor.innerHTML = status.card.author_name;
                        cardWrapper.appendChild(cardAutor);
                    }

                    statusBox.appendChild(cardWrapper);
                }

                mb.appendChild(statusBoxWrapper);
                postCnt++;
            }
        });

        if (!callback) {
            document.getElementById("threadInfoPostCnt").innerHTML = postCnt;
            if (postCnt == 1) {
                document.getElementById("threadInfoPostCnt").innerHTML += " Post";
            } else {
                document.getElementById("threadInfoPostCnt").innerHTML += " Posts";
            }
        }

        if (callback) {
            callback(mb);
        }

    }
};