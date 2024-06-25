$(document).ready(function () {
    let c = 0; // カウンターの初期値

    function updateCounter() {
        c++;
        $(".counter").text(c.toString());
        if (c >= 100) {
            $(".counter").addClass("hide");
            $(".preloader").addClass("active");
        } else {
            // 10から250ミリ秒のランダムな間隔で次のカウントを設定
            setTimeout(updateCounter, Math.random() * 190 + 10);
        }
    }

    $(document).keydown(function (e) {
        if (e.key === 'Enter') {
            updateCounter();
        }
    });
});
