 
        function previewLandmarkImage() {

            const file =
                document.getElementById("landmarkImage")
                    .files[0];

            if (!file) return;

            const reader = new FileReader();

            reader.onload = function (e) {

                landmarkImageData = e.target.result;

                document.getElementById("imagePreview")
                    .innerHTML = `
<img
    src="${e.target.result}"
    style="
        max-width:300px;
        margin-top:10px;
        border-radius:10px;
    "
>
`;
            };

            reader.readAsDataURL(file);
        }