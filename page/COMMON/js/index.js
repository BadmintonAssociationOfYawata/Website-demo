// グローバル変数
let currentIndex = 0;

//グローバル定数
let itemsPerView; // 画面に見える枚数

const itemsMaxCount = 10;

const headerTitleRow = 0;
const updatesDate = 0;
const updatesExplain = 1;
const updatesImgFile = 2;
const updatesImgAlt = 3;
const updatesURL = 4;

const isMobile = document.documentElement.clientWidth <= 768;

// 最新情報を初期化
function initUpdateInfo(){

    if (isMobile) {
        itemsPerView = 1;
    } else {
        itemsPerView = 4;
    }

    //最新情報の読み込み
    loadUpdatesData().then(result => {

        if ( result == false ) {
            return;
        }

        const items = document.querySelectorAll('.index-updates-item');
        const itemsCnt = items.length;

        for(let i = 0; i < itemsCnt; i++){
            //カードのサイズの調整
            if (itemsCnt > itemsPerView) {
                items[i].style.minWidth = `calc(100% / ${itemsPerView + 0.2})`;
            } else {
                items[i].style.minWidth = `calc(100% / ${itemsCnt + 0.2})`;
            }

            const dot = document.createElement('span');

            // 最初のドットをアクティブにする
            if ( i == 0 ) {
                dot.classList.add('active');
            }

            // ドットをクリックしたときのイベント
            dot.onclick = () => {
                currentIndex = i;
                goToSlide();
            };

            //カードをクリックしたときのイベント
            items[i].onclick = () => {
                if ( i == currentIndex ) {
                    //URLがセットされていたら遷移
                    if (items[i].dataset.url != "" ) {
                        window.location.href = items[i].dataset.url;
                    } else {
                        return;
                    }
                }
                currentIndex = i;
                goToSlide();
            };

            document.querySelector('.index-updates-dots').appendChild(dot);
        }
        goToSlide();
        if (isMobile) {
            initUpdateSwipe();
        }
    });

}

function initUpdateSwipe() {
    const area = document.querySelector(".index-updates-area");
    const slider = document.getElementById("index-updates-slider");

    if (!area || !slider) {
        return;
    }

    // 画面幅ベースで閾値を決める（重要）
    const threshold = area.clientWidth * 0.2;

    let startX = 0;
    let startY = 0;
    let diffX = 0;
    let diffY = 0;
    let currentX = 0;

    let isDragging  = false;

    area.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;

        isDragging = false;

        const style = window.getComputedStyle(slider);
        const matrix = new DOMMatrixReadOnly(style.transform);

        currentX = matrix.m41;

    }, { passive: true });

    area.addEventListener("touchmove", (e) => {
        diffX = e.touches[0].clientX - startX;
        diffY = e.touches[0].clientY - startY;;

        if (!isDragging) {
            // 横スワイプと判断したらスクロール止める
            if (Math.abs(diffX) > Math.abs(diffY)) {
                isDragging = true;
                e.preventDefault();
            }
        }
        if (isDragging) {
            let scale = 0;
            if (diffX > 0) {
                scale = 1;
            } else {
                scale = -1;
            }

            slider.style.transform = `translateX(${currentX + (scale * threshold)}px)`;
        }
    }, { passive: false });

    area.addEventListener("touchend", (e) => {
        if (isDragging) {
            slider.style.transform = `translateX(${currentX}px)`;
            if (Math.abs(diffX) >= threshold) {
                if (diffX > 0) {
                    prevSlide();
                } else {
                    nextSlide();
                }
            }
        } 
        isDragging = false;
    });
}

function loadUpdatesData() {
    //ファイルの読み込み
    return fetch(`./updates.csv`)
    .then(res => {
        if (!res.ok) {
            // 404ここでキャッチ
            throw new Error("ファイルなし");
        }
        return res.arrayBuffer();
    })
    .then(buffer => {
        const decoder = new TextDecoder("shift_jis");
        const text = decoder.decode(buffer);

        const rows = parseCSV(text);

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        let count = 0;

        //最新情報から確認
        for (let i = rows.length - 1; i > headerTitleRow; i--) {
            // データ行が全て空白の場合はスキップ
            if (!rows[i] || rows[i].every( col => col.trim() == "" ) ) {
                continue; 
            }
            let row = null;
            row = rows[i];

            //更新日または更新内容が空白の場合はスキップ
            if ( row[updatesDate] == "" || row[updatesExplain] == "" ) {
                continue;
            }

            //更新日が到達日か確認　到達日でない場合は表示しない
            if ( new Date(row[updatesDate]) > now ) {
                continue;
            }

            const temp = document.getElementById("index-updates-temp");
            const item = temp.content.cloneNode(true);

            //更新日
            item.querySelector(".index-updates-date").innerHTML = formatDate(row[updatesDate]);

            //更新内容
            item.querySelector(".index-updates-explain").innerHTML = row[updatesExplain];

            //画像ファイル
            if ( row[updatesImgFile] != "" ) {
                item.querySelector(".index-updates-image-img").src = row[updatesImgFile];
                if ( row[updatesImgAlt] != "" ) {
                    item.querySelector(".index-updates-image-img").alt = row[updatesImgAlt];
                }
            }

            if ( row[updatesURL] != "" ) {
                //更新先URL
                item.querySelector(".index-updates-item").dataset.url = row[updatesURL];
            }

            if (count == 0) {
                item.querySelector(".index-updates-item").classList.add("active");
            }

            document.getElementById("index-updates-slider").appendChild(item);

            count++;

            if ( count >= itemsMaxCount ) {
                break;
            }
        }

        return true;

    }).catch(err => {
        document.getElementById("index-updates-slider").innerHTML += err.message;
        return false;
    });
}

// スライド操作 次へ
function nextSlide() {
    const itemsCnt = document.querySelectorAll('.index-updates-item').length;
    
    if(currentIndex < itemsCnt - 1){
        currentIndex++;
        goToSlide();
    }
}

// スライド操作　前へ
function prevSlide() {
    if(currentIndex > 0){
        currentIndex--;
        goToSlide();
    }
}

// スライド移動
function goToSlide(){
    //スライダーの移動
    const area = document.querySelector('.index-updates-area');
    const slider = document.querySelector('.index-updates-slider');
    const items = document.querySelectorAll('.index-updates-item');

    const itemsCnt = items.length;

    // 1枚分の実際の横幅（margin込み）を取る
    const itemRect = items[currentIndex].getBoundingClientRect();
    const itemStyle = window.getComputedStyle(items[currentIndex]);
    const marginLeft = parseFloat(itemStyle.marginLeft) || 0;
    const marginRight = parseFloat(itemStyle.marginRight) || 0;
    const itemFullWidth = itemRect.width + marginLeft + marginRight;

    let XPos = 0;

    if (itemsCnt > itemsPerView) {
         XPos = items[currentIndex].offsetLeft - (area.clientWidth - items[currentIndex].offsetWidth) / 2;
    }

    const maxXPos = (itemsCnt - itemsPerView) * itemFullWidth; // スライドの最大位置（2%は余白分）

    if( XPos <= 0 ) {
        slider.style.transform = `translateX(0px)`;
    } else if(XPos >= maxXPos ) {
        slider.style.transform = `translateX(${maxXPos * -1}px)`;
    } else {
        slider.style.transform = `translateX(${XPos * -1}px)`;
    }

    // ドットのアクティブ切り替え
    const dots = document.querySelector('.index-updates-dots').querySelectorAll('span');
    dots.forEach(dot => {
        dot.classList.remove('active');
    });
    dots[currentIndex].classList.add('active');

    //　更新カードのアクティブ切り替え
    items.forEach(item => {
        item.classList.remove('active');
    });

    //　カードの画像サイズの調整
    const itemImg = items[currentIndex].querySelector('.index-updates-image img');
    if (itemImg) {
        let charSize = 0;
        charSize += 40; // index-update-itemのpadding分
        charSize += getFullHeight(items[currentIndex].querySelector('h3'));
        charSize += getFullHeight(items[currentIndex].querySelector('p'));
        charSize += 40; // pのmargin分
        itemImg.style.maxHeight = `${300 - charSize}px`;
    }

    //　カードのアクティブ化
    items[currentIndex].classList.add('active');
}

function getFullHeight(el) {
    return el.scrollHeight;
}