//デモモードをONにする場合はtrueに設定すること
const isDemo = true;
const correctPass = "51baec737194e5dd4dd59694a3d33d39911d24f9066873dccab79ea4f7398038";

let waiteTime = 10;

async function checkDemoIndex() {
    if (isDemo == false) {
        waiteTime = 10;
        checkOKProc();
        return;
    }

    if(sessionStorage.getItem("auth") !== "ok"){
        const pass = prompt("パスワードを入力してください");
        const hashPass = await sha256(pass);

        if ( hashPass == correctPass) {
            sessionStorage.setItem("auth", "ok");

            alert(`ログイン成功です　${waiteTime}秒後に日本語ページに遷移します`);

        } else {
            window.location.href = `./page/JPN/html/401error.html`;
        }
    }

    document.getElementById("count").innerHTML = waiteTime;
    setTimeout(pastTime, 1000);
    checkOKProc();
}

function pastTime() {
    waiteTime--;
    document.getElementById("count").innerHTML = waiteTime;
    setTimeout(pastTime, 1000);
}

function checkDemo() {
    if (isDemo == false) {
        checkOKProc();
        return;
    }

    if(sessionStorage.getItem("auth") !== "ok"){
        window.location.href = `./401error.html`;
    }

    checkOKProc();
}

function checkOKProc() {
    document.getElementById("auth-overlay").style.display = "none";
}

async function sha256(str){

    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}