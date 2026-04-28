
//グローバル定数
const headerTitleRow = 1;
const eventID = 0;
const eventDispOff = 1;
const eventDate = 2;
const eventName = 3;
const eventTypeTournament = 4;
const eventTypeEvent = 5;
const eventEligibility = 6;
const eventRegistDateFrom = 7;
const eventRegistDateTo = 8;
const eventRegistURL = 9;
const eventInfo = 10;
const eventTimeFrom = 11;
const eventTimeTo = 12;
const eventPlace = 13;
const eventPrice = 14;
const eventRemark = 15;
const eventSPHetml = 16;
const lastYearEventID = 17;

// グローバル変数
let currentIndex = 0;
let itemsPerView; // 画面に見える枚数

const isMobile = document.documentElement.clientWidth <= 768;


function initEvents() {
    //URLのクエリパラメータから年を取得
    const urlParams = new URLSearchParams(window.location.search);
    let yearParam = urlParams.get('year');
    if (yearParam) {

        // クエリパラメータに対応する年の要素をアクティブにする
        const yearElements = document.querySelectorAll('#events-years li');
        yearElements.forEach(el => {
            const link = el.querySelector('a'); // aタグを取得
            if (link) {
                const href = link.getAttribute('href');
                const linkYear = href.split('=')[1];
                if (linkYear === yearParam) {
                    el.classList.add('active');
                } else {
                    el.classList.remove('active');
                }
            }
        });

    //パラメータがない場合は最新の年を表示する　最新の年はactiveクラスがついているものとする
    } else {
        const activeYear = document.querySelector('#events-years li.active');
        if (activeYear) {
            yearParam = activeYear.querySelector('a').getAttribute('href').split('=')[1];
        }
    }
    // イベントの読み込み
    loadEventsList(yearParam);
}

function loadEventsList(yearParam) {
    fetch(`./events/${yearParam}/eventList.csv`)
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

        const ul = document.createElement("ul");
        ul.classList.add("events-list");

        //テンプレートの取得
        const temp = document.getElementById("events-item");
        
        rows.forEach((row, index) => {
            // ヘッダー行より上をスキップ
            if (index <= headerTitleRow) {
                return; 
            }

            // データ行が全て空白の場合はスキップ
            if (!row || row.every( col => col.trim() == "" ) ) {
                return; 
            }

            //表示OFFの場合はスキップ
            if ( row[eventDispOff] != "") {
                return;
            }

            const li = document.createElement("li");

            if (row[eventTypeTournament] != "") {
                li.classList.add("events-tournament");
            } else {
                li.classList.add("events-event");
            }

            const item = temp.content.cloneNode(true);

            let html = "";
            
            item.querySelector(".events-date").textContent = formatDate(row[eventDate]);
            item.querySelector(".events-title").textContent = row[eventName];

            if (row[eventEligibility] != "") {
                item.querySelector(".events-eligibility-span").classList.add("dispOn");
                item.querySelector(".events-eligibility").textContent = row[eventEligibility];
            }

            if (row[eventInfo] != "") {
                item.querySelector(".events-info").innerHTML = row[eventInfo];
            }

            if (row[eventRegistDateFrom] != "" && row[eventRegistDateTo] != "" && row[eventRegistURL] != "") {
                const now = new Date();
                now.setHours(0, 0, 0, 0);

                if (new Date(row[eventRegistDateFrom]) <= now && now <= new Date(row[eventRegistDateTo])) {
                    item.querySelector(".events-join").classList.add("dispOn");
                    item.querySelector(".events-join").href = row[eventRegistURL];
                }
            }
            item.querySelector(".events-detail").href = `./eventDetail.html?year=${yearParam}&eventid=${row[eventID]}`;

            li.appendChild(item);
            ul.appendChild(li);
        });

        document.getElementById("events-list-body").appendChild(ul);
        
    }).catch(err => {
        document.getElementById("events-list-body").innerHTML = `<p>データがありません ${err}</p>`;
    });
}

async function initEventDetail() {
    //URLのクエリパラメータから年を取得
    const urlParams = new URLSearchParams(window.location.search);
    const yearParam = urlParams.get('year');
    const idParam = urlParams.get('eventid');
    if ( yearParam && idParam ) {
        //ファイルの読み込み
        fetch(`./events/${yearParam}/eventList.csv`)
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

            let row = null;
            let header = null;
            

            for (let i = 0; i < rows.length; i++) {
                // ヘッダー行より上をスキップ
                if (i < headerTitleRow) {
                    continue; 

                //ヘッダー情報を保持
                } else if(i == headerTitleRow) {
                    header = rows[i];
                    continue;
                }

                // データ行が全て空白の場合はスキップ
                if (!rows[i] || rows[i].every( col => col.trim() == "" ) ) {
                    continue; 
                }

                //IDが一致したら終了
                if ( rows[i][eventID] == idParam ) {
                    row = rows[i];
                    break;
                }
            }

            if (row == null || header == null ) {
                throw new Error("データなし");
            }

            const temp = document.getElementById("event-detail");

            //パンくずリスト
            const breadcrumbs = temp.querySelector(".event-Breadcrumbs");
            breadcrumbs.querySelector(".breadcrumbs-prePage").href = `./events.html?year=${yearParam}`;
            breadcrumbs.querySelector(".breadcrumbs-title").textContent = row[eventName];

            //コンテンツ部分
            const eventContents = temp.querySelector(".event-contents");

            //タイトル
            eventContents.querySelector(".event-title").textContent = row[eventName];
            
            //コンテンツ部分
            const detailContents = eventContents.querySelector(".detail-contents");

            //TODO 特設ページありなら、特設ページ用HTMLをロードする

            //申込ボタン
            if (row[eventRegistDateFrom] != "" && row[eventRegistDateTo] != "" && row[eventRegistURL] != "") {
                const now = new Date();
                now.setHours(0, 0, 0, 0);

                if (new Date(row[eventRegistDateFrom]) <= now && now <= new Date(row[eventRegistDateTo])) {
                    detailContents.querySelector(".event-join").href = row[eventRegistURL];
                    detailContents.querySelector(".event-join").classList.add("dispOn");
                }
            }

            //日付
            detailContents.querySelector(".event-date").textContent = formatDate(row[eventDate]);

            //時間
            detailContents.querySelector(".start-time").textContent = row[eventTimeFrom];
            detailContents.querySelector(".end-time").textContent = row[eventTimeTo];

            //PDFダウンロード
            fetch(`./events/${yearParam}/event${idParam}.pdf`, {method: "HEAD" })
            .then(res => {
                if ( res.ok ) {
                    detailContents.querySelector(".event-pdf").classList.add("dispOn");
                    detailContents.querySelector(".event-pdf").href = `./events/${yearParam}/event${idParam}.pdf`
                }
            })

            //会場
            const place = row[eventPlace];
            if ( place ) {
                detailContents.querySelector(".event-place").classList.add("dispOn");
                detailContents.querySelector(".event-place").querySelector(".event-content-text").innerHTML = place;
            }

            //費用
            const price = row[eventPrice];
            if ( price ) {
                detailContents.querySelector(".event-price").classList.add("dispOn");
                detailContents.querySelector(".event-price").querySelector(".event-content-text").innerHTML = price;
            }

            //参加資格
            const eligibility = row[eventEligibility];
            if ( eligibility ) {
                detailContents.querySelector(".event-eligibility").classList.add("dispOn");
                detailContents.querySelector(".event-eligibility").querySelector(".event-content-text").innerHTML = eligibility;
            }

            //イベント説明
            const eventInfoText = row[eventInfo];
            if ( eventInfoText ) {
                detailContents.querySelector(".event-info").classList.add("dispOn");
                detailContents.querySelector(".event-info").querySelector(".event-content-text").innerHTML = eventInfoText;
            }

            //注意事項
            const eventRemarkText = row[eventRemark];
            if ( eventRemarkText != "" ) {
                detailContents.querySelector(".event-remark").classList.add("dispOn");
                detailContents.querySelector(".event-remark").querySelector(".event-content-text").innerHTML = eventRemarkText;
            }
  
            //画像部分

            if (isMobile) {
                itemsPerView = 1;
            } else {
                itemsPerView = 5;
            }

            //結果があれば結果、なければプログラム、両方なければ表示なし
            getImgFullFileURL(yearParam, idParam, "result", "1")
            .then( url => {
                if (url) {
                    loadImage(yearParam, idParam, "result", document.getElementById("event-result"));
                } else {
                    loadImage(yearParam, idParam, "program", document.getElementById("event-program"));
                }
            } );
            
            //当日画像があれば当日画像、なければ昨年画像、両方なければ表示なし
            getImgFullFileURL(yearParam, idParam, "toYear", "1")
            .then( url => {
                if (url) {
                    loadImage(yearParam, idParam, "toYear", document.getElementById("event-photo-toyear"));
                } else {
                    loadImage(yearParam, idParam, "lastYear", document.getElementById("event-photo-lastyear"));
                }
            } );

        }).catch(err => {
            window.location.href = `./events.html?year=${yearParam}`
            //document.getElementById("event-detail").innerHTML += err;
        });
        

    //パラメータがない場合はイベントページに遷移
    } else if(yearParam) {
        window.location.href = `./events.html?year=${yearParam}`
    } else {
        window.location.href = `./events.html`
    }
}

//ファイルの有無を確認
function checkImageFile(fileURL) {
    return fetch(fileURL, {method: "HEAD" })
        .then(res => res.ok)
        .catch(() => false);
}

async function getImgFullFileURL(yearParam, idParam, folderNm, fileNm) {
    const extentions = ["png","jpg","jpeg"];

    const baseUrl = `../../COMMON/images/eventPhoto/${yearParam}/${idParam}/${folderNm}/${fileNm}`;

    for (const extention of extentions) {
        if ( await checkImageFile(baseUrl + "." + extention) ) {
            return baseUrl + "." + extention;
        } else if(await checkImageFile(baseUrl + "." + extention.toUpperCase())){
            return baseUrl + "." + extention.toUpperCase();
        }
    };

    return null;
}

//画像の読み込み
function loadImage(yearParam, idParam, folderNm, targetPictSpaceEle, fileNameIndex = 1) {
    getImgFullFileURL(yearParam, idParam, folderNm, fileNameIndex)
    .then(url => {
        if (url) {
            const targetAreaEle = targetPictSpaceEle.querySelector(".event-pict-area .event-pict-slider");
            const temp = targetAreaEle.querySelector(".event-pict-item-temp");
            const item = temp.content.cloneNode(true);

            item.querySelector(".event-pict-item .event-pict-image").src = url;
            targetAreaEle.appendChild(item);

            loadImage( yearParam, idParam, folderNm, targetPictSpaceEle, fileNameIndex + 1);
        } else {
            if (fileNameIndex > 1) {
                targetPictSpaceEle.classList.add("dispOn");
                initPict(targetPictSpaceEle);
            }
        }

    });
}

// 画像表示の初期化
function initPict(target){

    //モーダル
    const modal = document.getElementById("event-modal");
    const modalImg = document.getElementById("event-modal-img");

    // 背景クリックで閉じる
    modal.addEventListener("click", () => {
        modal.classList.remove("show");
    });


    const items = target.querySelectorAll(".event-pict-item");
    const itemsCnt = items.length;

    //カードのサイズの調整
    let base = 0;
    const activeWidthRatio = 1.2;
    const inactiveWidthRatio = 1.0;
    if (itemsCnt > itemsPerView) {
        base = inactiveWidthRatio * (itemsPerView - 1) + activeWidthRatio * 1;
    } else {
        base = inactiveWidthRatio * (itemsCnt - 1) + (itemsCnt > 0 ? activeWidthRatio : 0);
    }
    target.style.setProperty('--inactiveItemMinWidht', `calc((100% / ${base} * ${inactiveWidthRatio}) - ${20}px)`);
    target.style.setProperty('--activeItemMinWidht', `calc((100% / ${base} * ${activeWidthRatio}) - ${20}px)`);

    //画像サイズの検討情報の保持
    target.dataset.base = base;

    //ボタンの動作設定
    target.querySelector(".event-prev-button").onclick = () => {
        prevSlide(target);
    }

    target.querySelector(".event-next-button").onclick = () => {
        nextSlide(target);
    }

    for(let i = 0; i < itemsCnt; i++){


        const dot = document.createElement('span');

        // 最初のドットをアクティブにする
        if ( i == 0 ) {
            dot.classList.add('active');
        }

        dot.dataset.index = i;

        // ドットをクリックしたときのイベント
        dot.onclick = () => {
            goToSlide(i, target);
        };

        //カードをクリックしたときのイベント
        items[i].onclick = () => {

            //既にアクティブの場合さらに大きく見せる
            const items = target.querySelectorAll('.event-pict-item');
            let index = 0;
            for (index ; index < items.length; index++) {
                if( items[index].classList.contains("active") ) {
                    break;
                }
            }
            
            if ( i == index) {
                //モーダル表示 & 画像設定
                modal.classList.add("show");
                modalImg.src = items[i].querySelector(".event-pict-image").src;
            } else {
                goToSlide(i, target);
            }
        };

        target.querySelector('.event-pict-dots').appendChild(dot);
    }

    goToSlide(0 , target);
    if ( isMobile ) {
        initPictSwipe(target);
    }

}

function initPictSwipe(target) {
    const area = target.querySelector(".event-pict-area");
    const slider = area.querySelector(".event-pict-slider");

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
                    prevSlide(target);
                } else {
                    nextSlide(target);
                }
            }
        } 
        isDragging = false;
    });
}

// スライド操作 次へ
function nextSlide(target) {
    const dots = target.querySelectorAll('.event-pict-dots span');
    let currentIndex = 0;

    dots.forEach((dot) => {
        if ( dot.classList.contains("active") ) {
            currentIndex = parseInt(dot.dataset.index, 10);
        }
    });

    if (currentIndex < dots.length - 1){
        goToSlide(currentIndex + 1, target);
    }
}

// スライド操作　前へ
function prevSlide(target) {
    const dots = target.querySelectorAll('.event-pict-dots span');
    let currentIndex = 0;

    dots.forEach((dot) => {
        if ( dot.classList.contains("active") ) {
            currentIndex = parseInt(dot.dataset.index, 10);
        }
    });

    if(currentIndex > 0){
        goToSlide(currentIndex - 1, target);
    }
}

// スライド移動
function goToSlide(index, target){

    //ベースの取得
    const base = parseFloat(target.dataset.base);

    //スライダーの移動
    const slider = target.querySelector('.event-pict-area .event-pict-slider');

    const itemsCnt = target.querySelectorAll('.event-pict-item').length;
    let XPos = 0;

    if (itemsCnt > itemsPerView) {
        XPos = index * (100 / base);
    }

    const maxXPos = (itemsCnt - itemsPerView) * ( 100 / base ) ; // スライドの最大位置

    if ( XPos < maxXPos || maxXPos < 0 ) {
        slider.style.transform = `translateX(${XPos * -1}%)`;
    } else {
        slider.style.transform = `translateX(${maxXPos * -1}%)`;
    }

    // ドットのアクティブ切り替え
    const dots = target.querySelector('.event-pict-dots').querySelectorAll('span');
    dots.forEach(dot => {
        dot.classList.remove('active');
    });
    dots[index].classList.add('active');

    //　更新カードのアクティブ切り替え
    const items = target.querySelectorAll('.event-pict-item');
    items.forEach(item => {
        item.classList.remove('active');
    });

    //　カードのアクティブ化
    items[index].classList.add('active');
}