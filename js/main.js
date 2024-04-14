var main = {
    init: function () {
        //Hide banner in case it's been displayed previously
        document.getElementById("posturl").onkeydown = function () {
            document.getElementById("underInputBanner").style.display = "none";
        };
    },
    unrollButton: function () {
        var postUrl = document.getElementById("posturl").value;

        //plausibility check
        var urlRegex = /^http(s)*:\/\/.*@.*\/\d*$/;
        if (urlRegex.test(postUrl)) {

            var splitUriRegex = /^(http(?:s)*:\/\/.*?)\/(?:deck\/)*(@.*)\/(\d*$)/;
            //I'm rather proud of this regex.
            //It extracts the server domain, the username and the post ID.

            var regexRes = splitUriRegex.exec(postUrl);
            var serverDomain = regexRes[1];
            //var username = regexRes[2];
            var postID = regexRes[3];

            //Send to /thread for display
            document.location = "thread?uri=" + encodeURIComponent(serverDomain) + "&id=" + encodeURIComponent(postID);

        } else {
            //Normally this should never show up
            //Because the browser is supposed to catch this.
            //But let's better be save then sorry.
            var banner = document.getElementById("underInputBanner");
            banner.innerHTML = "The URL is in the wrong format.";
            banner.style.display = "block";
        }
    }
};
main.init();