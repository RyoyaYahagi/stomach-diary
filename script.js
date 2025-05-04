(function () {
  const form = document.getElementById("recordForm");
  const latestContainer = document.getElementById("latestRecords");
  const calendarContainer = document.getElementById("calendar");
  const aggregateContainer = document.getElementById("aggregate");
  const currentTimeBtn = document.getElementById("currentTimeBtn");
  let records = {};

  // Global variables to track the currently displayed calendar month/year
  let currentCalendarYear;
  let currentCalendarMonth;

  // 初期化のタイミングで今月を設定
  (function initCalendar() {
    const now = new Date();
    currentCalendarYear = now.getFullYear();
    currentCalendarMonth = now.getMonth(); // 0～11
  })();

  // 現在時刻ボタンのイベントリスナー
  currentTimeBtn.addEventListener("click", function () {
    const now = new Date();
    const year = now.getFullYear();
    const month = ("0" + (now.getMonth() + 1)).slice(-2);
    const day = ("0" + now.getDate()).slice(-2);
    document.getElementById("date").value = year + "-" + month + "-" + day;
    const hours = ("0" + now.getHours()).slice(-2);
    const minutes = ("0" + now.getMinutes()).slice(-2);
    document.getElementById("time").value = hours + ":" + minutes;
  });

  // ローカルストレージから記録を読み込む
  function loadRecords() {
    const stored = localStorage.getItem("dinnerRecords");
    if (stored) {
      records = JSON.parse(stored);
    }
  }

  // ローカルストレージに記録を保存する
  function saveRecords() {
    localStorage.setItem("dinnerRecords", JSON.stringify(records));
  }

  // 最近の記録5件を更新して表示
  function updateLatestRecords() {
    latestContainer.innerHTML = "";
    let allRecords = [];
    Object.keys(records).forEach(date => {
      records[date].forEach(rec => {
        allRecords.push({
          date: date,
          time: rec.time,
          menu: rec.menu,
          memo: rec.memo || "",
          bowel: rec.bowel
        });
      });
    });
    // 日付と時刻で降順ソート
    allRecords.sort((a, b) => {
      if (a.date === b.date) {
        return b.time.localeCompare(a.time);
      }
      return b.date.localeCompare(a.date);
    });
    const recent = allRecords.slice(0, 5);

    if (recent.length > 0) {
      const table = document.createElement("table");
      const headerRow = document.createElement("tr");
      ["日付", "時間", "夕食メニュー", "メモ", "便の状態", "操作"].forEach(text => {
        const th = document.createElement("th");
        th.textContent = text;
        headerRow.appendChild(th);
      });
      table.appendChild(headerRow);

      recent.forEach(rec => {
        const row = document.createElement("tr");

        const tdDate = document.createElement("td");
        tdDate.textContent = rec.date;
        row.appendChild(tdDate);

        const tdTime = document.createElement("td");
        tdTime.textContent = rec.time;
        row.appendChild(tdTime);

        const tdMenu = document.createElement("td");
        tdMenu.textContent = rec.menu;
        row.appendChild(tdMenu);

        const tdMemo = document.createElement("td");
        tdMemo.textContent = rec.memo;
        row.appendChild(tdMemo);

        const tdBowel = document.createElement("td");
        tdBowel.textContent = rec.bowel;
        row.appendChild(tdBowel);

        const tdAction = document.createElement("td");
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "削除";
        deleteBtn.addEventListener("click", function () {
          // 削除は日付・時間・メニューで対象を特定
          deleteRecord(rec.date, rec.time, rec.menu);
        });
        tdAction.appendChild(deleteBtn);
        row.appendChild(tdAction);

        table.appendChild(row);
      });
      latestContainer.appendChild(table);
    } else {
      latestContainer.textContent = "記録がありません。";
    }
  }

  // 月間カレンダーの更新 (前後の月も表示できるようにナビゲーション追加)
  function updateCalendar() {
    calendarContainer.innerHTML = "";

    // ナビゲーション用コンテナ
    const navDiv = document.createElement("div");
    navDiv.classList.add("calendar-nav");

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "前月";
    prevBtn.addEventListener("click", function () {
      currentCalendarMonth--;
      if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
      }
      updateCalendar();
    });
    navDiv.appendChild(prevBtn);

    const monthLabel = document.createElement("span");
    monthLabel.textContent = currentCalendarYear + "年 " + (currentCalendarMonth + 1) + "月";
    monthLabel.classList.add("month-label");
    navDiv.appendChild(monthLabel);

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "翌月";
    nextBtn.addEventListener("click", function () {
      currentCalendarMonth++;
      if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
      }
      updateCalendar();
    });
    navDiv.appendChild(nextBtn);

    calendarContainer.appendChild(navDiv);

    // カレンダー用テーブル作成
    const table = document.createElement("table");
    table.classList.add("calendar");
    const daysOfWeek = ["日", "月", "火", "水", "木", "金", "土"];
    const headerRow = document.createElement("tr");
    daysOfWeek.forEach(day => {
      const th = document.createElement("th");
      th.textContent = day;
      headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    // その月の初日と最終日から日数を取得
    const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1);
    const lastDate = new Date(currentCalendarYear, currentCalendarMonth + 1, 0).getDate();

    let date = 1;
    for (let i = 0; i < 6; i++) {
      const row = document.createElement("tr");
      for (let j = 0; j < 7; j++) {
        const cell = document.createElement("td");
        if (i === 0 && j < firstDay.getDay()) {
          cell.textContent = "";
        } else if (date > lastDate) {
          cell.textContent = "";
        } else {
          const formattedDate = currentCalendarYear + "-" + ("0" + (currentCalendarMonth + 1)).slice(-2) + "-" + ("0" + date).slice(-2);
          const cellDiv = document.createElement("div");
          cellDiv.classList.add("calendar-day");

          const dayLabel = document.createElement("div");
          dayLabel.textContent = date;
          dayLabel.classList.add("day-label");
          cellDiv.appendChild(dayLabel);

          // アイコン表示：記録があれば病状に合わせて表示
          if (records[formattedDate]) {
            let iconSrc = "icons/smile.png";  // デフォルトは正常
            const dayRecords = records[formattedDate];
            if (dayRecords.some(r => r.bowel === "下痢気味")) {
              iconSrc = "icons/cry.png";
            } else if (dayRecords.some(r => r.bowel === "柔らかい" || r.bowel === "硬い")) {
              iconSrc = "icons/normal.png";
            } else if (dayRecords.some(r => r.bowel === "正常")) {
              iconSrc = "icons/smile.png";
            }
            const img = document.createElement("img");
            // 画像は dinnerTracker フォルダ内にあるので、"./" を用いて相対パスで指定
            img.src = "./" + iconSrc;
            img.alt = dayRecords[0].bowel;
            img.classList.add("calendar-icon");
            // 固定サイズ (30px by 30px)
            img.style.width = "30px";
            img.style.height = "30px";
            // クリックで詳細表示
            img.addEventListener("click", function () {
              showRecordDetails(formattedDate);
            });
            cellDiv.appendChild(img);
          }
          cell.appendChild(cellDiv);
          date++;
        }
        row.appendChild(cell);
      }
      table.appendChild(row);
    }
    calendarContainer.appendChild(table);
  }

  // 下痢気味の記録だけを集計して表示
  function updateAggregate() {
    aggregateContainer.innerHTML = "";
    const aggregate = {};
    Object.keys(records).forEach(date => {
      records[date].forEach(record => {
        if (record.bowel === "下痢気味") {
          if (aggregate[record.menu]) {
            aggregate[record.menu]++;
          } else {
            aggregate[record.menu] = 1;
          }
        }
      });
    });
    if (Object.keys(aggregate).length > 0) {
      const table = document.createElement("table");
      const headerRow = document.createElement("tr");
      ["夕食メニュー", "下痢気味件数"].forEach(text => {
        const th = document.createElement("th");
        th.textContent = text;
        headerRow.appendChild(th);
      });
      table.appendChild(headerRow);
      Object.keys(aggregate).forEach(menu => {
        const row = document.createElement("tr");
        const tdMenu = document.createElement("td");
        tdMenu.textContent = menu;
        row.appendChild(tdMenu);
        const tdCount = document.createElement("td");
        tdCount.textContent = aggregate[menu];
        row.appendChild(tdCount);
        table.appendChild(row);
      });
      aggregateContainer.appendChild(table);
    } else {
      aggregateContainer.textContent = "下痢気味の記録はありません。";
    }
  }

  // レコード詳細を表示（アラートで詳細内容を表示）
  function showRecordDetails(date) {
    if (records[date]) {
      let details = date + "\n";
      records[date].forEach((rec, index) => {
        details += "Record " + (index + 1) + ":\n";
        details += "  時間: " + rec.time + "\n";
        details += "  夕食メニュー: " + rec.menu + "\n";
        details += "  メモ: " + (rec.memo || "") + "\n";
        details += "  便の状態: " + rec.bowel + "\n";
      });
      alert(details);
    } else {
      alert("記録がありません。");
    }
  }

  // 日付・時刻・メニューでレコードを削除する
  function deleteRecord(date, time, menu) {
    if (records[date]) {
      const idx = records[date].findIndex(r => r.time === time && r.menu === menu);
      if (idx !== -1) {
        records[date].splice(idx, 1);
        if (records[date].length === 0) {
          delete records[date];
        }
        saveRecords();
        updateDisplay();
      }
    }
  }

  // 全ての表示を更新
  function updateDisplay() {
    // Update calendar and aggregate first, then display recent records at the bottom.
    updateCalendar();
    updateAggregate();
    updateLatestRecords();
  }

  // フォームの送信処理
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const menu = document.getElementById("menu").value;
    const memo = document.getElementById("memo").value;
    const bowel = document.getElementById("bowel").value;
    if (!date || !time || !menu || !bowel) return;
    if (!records[date]) {
      records[date] = [];
    }
    records[date].push({ time, menu, memo, bowel });
    saveRecords();
    updateDisplay();
    form.reset();
  });

  // 初期化
  loadRecords();
  updateDisplay();
})();