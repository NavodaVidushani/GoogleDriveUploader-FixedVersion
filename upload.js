$(document).ready(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const redirect_uri = "http://127.0.0.1:5500/upload.html"; // The redirect uri
    const client_secret = "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"; // Project Client Secret
    const scope = "https://www.googleapis.com/auth/drive";
    var access_token = "";
    var client_id = "279888638943-o33dgjbqfp5bp8otbqcsu1j2pfd1oe5m.apps.googleusercontent.com"; // Project Client ID

    function requestAccessToken() {
        $.ajax({
            type: 'POST',
            url: "https://www.googleapis.com/oauth2/v4/token",
            data: {
                code: code,
                redirect_uri: redirect_uri,
                client_secret: client_secret,
                client_id: client_id,
                scope: scope,
                grant_type: "authorization_code"
            },
            dataType: "json",
            success: function (resultData) {
                sessionStorage.setItem("accessToken", resultData.access_token);
                sessionStorage.setItem("refreshToken", resultData.refreshToken);
                sessionStorage.setItem("expires_in", resultData.expires_in);
                window.history.pushState({}, document.title, "/gDriveUpload/" + "upload.html");
            }
        });
    }

    function getAccessToken() {
        const expiresAt = sessionStorage.getItem("expires_at");
        const accessToken = sessionStorage.getItem("accessToken");
        if (accessToken && new Date().getTime() < expiresAt) {
            return accessToken;
        } else {
            requestAccessToken();
        }
    }

    function stripQueryStringAndHashFromPath(url) {
        return url.split("?")[0].split("#")[0];
    }

    var Upload = function (file) {
        this.file = file;
    };

    Upload.prototype.getType = function () {
        sessionStorage.setItem("type", this.file.type);
        return this.file.type;
    };

    Upload.prototype.getSize = function () {
        sessionStorage.setItem("size", this.file.size);
        return this.file.size;
    };

    Upload.prototype.getName = function () {
        return this.file.name;
    };

    Upload.prototype.doUpload = function () {
        var that = this;
        var formData = new FormData();

        // add assoc key values, this will be posts values
        formData.append("file", this.file, this.getName());
        formData.append("upload_file", true);

        $.ajax({
            type: "POST",
            beforeSend: function (request) {
                request.setRequestHeader("Authorization", "Bearer" + " " + getAccessToken());
            },
            url: "https://www.googleapis.com/upload/drive/v2/files",
            data: {
                uploadType: "media"
            },
            xhr: function () {
                var myXhr = $.ajaxSettings.xhr();
                if (myXhr.upload) {
                    myXhr.upload.addEventListener('progress', that.progressHandling, false);
                }
                return myXhr;
            },
            success: function (data) {
                console.log(data);
            },
            error: function (error) {
                console.log(error);
            },
            async: true,
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
            timeout: 60000
        });
    };

    Upload.prototype.progressHandling = function (event) {
        var percent = 0;
        var position = event.loaded || event.position;
        var total = event.total;
        var progress_bar_id = "#progress-wrp";
        if (event.lengthComputable) {
            percent = Math.ceil(position / total * 100);
        }
        // update progressbars classes so it fits your code
        $(progress_bar_id + " .progress-bar").css("width", +percent + "%");
        $(progress_bar_id + " .status").text(percent + "%");
    };

    $("#upload").on("click", function (e) {
        var file = $("#files")[0].files[0];
        var upload = new Upload(file);

        // executing the upload
        upload.doUpload();
    });
});
