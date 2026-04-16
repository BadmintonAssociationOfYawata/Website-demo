// グローバル変数
let currentIndex = 0;

//グローバル定数
const itemsPerView = 4; // 画面に見える枚数

const itemsMaxCount = 10;

const headerTitleRow = 0;
const updatesDate = 0;
const updatesExplain = 1;
const updatesImgFile = 2;
const updatesImgAlt = 3;
const updatesURL = 4;

// 最新情報を初期化
function initUpdateInfo(){

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
        goToSlide(currentIndex);
    }
}

// スライド操作　前へ
function prevSlide() {
    if(currentIndex > 0){
        currentIndex--;
        goToSlide(currentIndex);
    }
}

// スライド移動
function goToSlide(){
    //スライダーの移動
    const slider = document.querySelector('.index-updates-slider');

    const itemsCnt = document.querySelectorAll('.index-updates-item').length;
    let XPos = 0;

    if (itemsCnt > itemsPerView) {
         XPos = currentIndex * ( 100 / itemsPerView );
    }

    const maxXPos = (itemsCnt - itemsPerView) * ( 100 / itemsPerView ) + 2; // スライドの最大位置（2%は余白分）

    if ( XPos < maxXPos ) {
        slider.style.transform = `translateX(${XPos * -1}%)`;
    } else {
        slider.style.transform = `translateX(${maxXPos * -1}%)`;
    }

    // ドットのアクティブ切り替え
    const dots = document.querySelector('.index-updates-dots').querySelectorAll('span');
    dots.forEach(dot => {
        dot.classList.remove('active');
    });
    dots[currentIndex].classList.add('active');

    //　更新カードのアクティブ切り替え
    const items = document.querySelectorAll('.index-updates-item');
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