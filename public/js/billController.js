
let allparticipants = []
let participants = [];
let payments = {};
let totalAmount = 0;
let payer = "";
    
// 加入參與者
function addParticipants() {
    const apiUrl = '/names'; // Replace with your API endpoint
    const ms = document.getElementById("ms");
    fetch(apiUrl).then(d=>d.json()).then(d=>{
        ms.innerHTML = 
          d.map(t=>'<option value="'+t.name+'">'+t.name+'</option>');
        ms.loadOptions();
      })
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Extract names from the API data
            const allParticipants = data.map(participant => participant.name);

            // Clear existing options in the payer select
            const payerSelect = document.getElementById("payer");
            // const participantSelect = document.getElementById("ms");
            payerSelect.innerHTML = "";
            
            allParticipants.forEach(participant => {
                const option = document.createElement("option");
                option.value = participant;
                option.textContent = participant;
                payerSelect.appendChild(option);
            });
        
            // Show payer input
            document.getElementById("participants-input").style.display = "block";
            document.getElementById("payer-input").style.display = "block";
            showMessage("參與者已加入！");
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
            showMessage("無法獲取參與者資料！", "error");
        });
}

// 設置付款
function setupPayment() {
    payer = document.getElementById("payer").value;
    totalAmount = parseFloat(document.getElementById("total-amount").value);
    console.log(participants.length)
    if (participants.length == 0) {
        showMessage("請確認參與者資料！", "error");
        return
    }

    if (!payer || isNaN(totalAmount) || totalAmount <= 0) {
        showMessage("請確認付款人及總金額！", "error");
        return;
    }

    const paymentList = document.getElementById("payment-list");
    paymentList.innerHTML = "";
    participants.forEach(participant => {
        const div = document.createElement("div");
        div.innerHTML = `
          <label>${participant} 的應付金額:</label>
          <input type="number" id="payment-${participant}" placeholder="輸入金額" min="0" step="0.01">
        `;
        paymentList.appendChild(div);
    });

    document.getElementById("payment-inputs").style.display = "block";
    showMessage("請輸入每位參與者的應付金額！");
}

// 完成記錄
function finalizePayment() {
    let totalAssigned = 0;

    participants.forEach(participant => {
        const paymentInput = document.getElementById(`payment-${participant}`);
        const amount = parseFloat(paymentInput.value) || 0;
        payments[participant] = {
            amount,
            paid: participant === payer ? amount : 0, // 先墊款人默認已支付
        };
        totalAssigned += amount;
    });

    if (Math.abs(totalAssigned - totalAmount) > 0.01) {
        showMessage(`分配的金額總和 (${totalAssigned}) 與總金額 (${totalAmount}) 不匹配！請檢查數據。`, "error");
        return;
    }

    document.getElementById("status-section").style.display = "block";
    displayResults();
    showMessage("分帳記錄已完成！");
}

// 顯示結果
function displayResults() {
    const resultsTable = document.getElementById("results").querySelector("tbody");
    resultsTable.innerHTML = "";

    participants.forEach(participant => {
        const row = document.createElement("tr");
        const nameCell = document.createElement("td");
        const amountCell = document.createElement("td");
        const statusCell = document.createElement("td");
        const actionCell = document.createElement("td");

        const payment = payments[participant];
        const balance = payment.amount - payment.paid;

        nameCell.textContent = participant;
        amountCell.textContent = `$${payment.amount.toFixed(2)}`;
        statusCell.innerHTML = balance === 0
            ? `<span class="paid">已支付</span>`
            : `<span class="unpaid">未支付：$${balance.toFixed(2)}</span>`;

        if (balance > 0) {
            actionCell.innerHTML = `<button onclick="markAsPaid('${participant}')">標記已支付</button>`;
        } else {
            actionCell.textContent = "-";
        }

        row.appendChild(nameCell);
        row.appendChild(amountCell);
        row.appendChild(statusCell);
        row.appendChild(actionCell);
        resultsTable.appendChild(row);
    });

    checkBalance();
}

// 標記某人已支付
function markAsPaid(participant) {
    payments[participant].paid = payments[participant].amount;
    displayResults();
    showMessage(`${participant} 已完成支付！`);
}

// 檢查整體平衡
function checkBalance() {
    const totalPaid = Object.values(payments).reduce((sum, payment) => sum + payment.paid, 0);
    const balanceStatus = document.getElementById("balance-status");
    if (Math.abs(totalPaid - totalAmount) < 0.01) {
        balanceStatus.textContent = "所有金額已平衡！";
        balanceStatus.style.color = "green";
    } else {
        balanceStatus.textContent = `金額不平衡！差額：$${(totalAmount - totalPaid).toFixed(2)}`;
        balanceStatus.style.color = "red";
    }
}



