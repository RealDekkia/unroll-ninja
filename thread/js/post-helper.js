const posthelper = {
    post: function (uri, body, callback) {
        //based on https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/send#example_post

        const xhr = new XMLHttpRequest();
        xhr.open("POST", uri, true);

        // Send the proper header information along with the request
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onreadystatechange = () => {
            // Call a function when the state changes.
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status == 200) {
                    callback(JSON.parse(xhr.response));
                } else {
                    callback(xhr);
                }
            }
        };
        xhr.send(body);
    }
}