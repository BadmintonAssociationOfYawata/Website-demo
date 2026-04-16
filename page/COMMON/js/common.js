function loadHtml(id, path, currentPage = "") {
    return fetch(path)
        .then(res => res.text())
        .then(data => {
            document.getElementById(id).innerHTML = data;

            if (currentPage != "") {
                document.getElementById(currentPage).className = "active";
            }
        })
        .catch(err => {
            console.error(`読み込み失敗 [id=${id}] [path=${path}]`, err);
        });
}

function formatDate(strDate){
    const dtDate = new Date(strDate);
    if (isNaN(dtDate.getTime())) {
        return "";
    } 

    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

    return `${dtDate.getFullYear()}年${dtDate.getMonth() + 1}月${dtDate.getDate()}日(${weekdays[dtDate.getDay()]})`
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(current);
      current = "";
    } else if (char === '\n' && !inQuotes) {
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }

  row.push(current);
  rows.push(row);

  return rows;
}