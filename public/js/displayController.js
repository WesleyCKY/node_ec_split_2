// window.onload = addParticipants;
window.onload = function() {
    const url = window.location.href;
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    const tab = params.get('tab');
    // Display the value in the console
    console.log('Value of "tab":', tab);

    if (tab === 'admin') {
        showAdmin()        
    } else {
        showBill()
    } 
};

function msOnchange(selectedOptions) {
    console.log(Array.from(selectedOptions).map(x=>x.value??x.text))
    participants = Array.from(selectedOptions).map(x=>x.value??x.text)
    // update payer option list
    updatePayerOptions(participants)
}

function updatePayerOptions(participants) {
    console.log('updatePayerOptions: ', participants)
    const payerSelect = document.getElementById("payer");
    payerSelect.innerHTML = "";
    participants.forEach(participant => {
        const option = document.createElement("option");
        option.value = participant;
        option.textContent = participant;
        payerSelect.appendChild(option);
    });
}

function showBill() {
    addParticipants()
    const billEle = document.getElementById("bill");
    const adminEle = document.getElementById("admin");
    adminEle.style.display = "none";
    billEle.style.display = "block";
    updateQueryString('tab', 'bill');
}

function showAdmin() {
    fetchUsers()
    const billEle = document.getElementById("bill");
    const adminEle = document.getElementById("admin");
    adminEle.style.display = "block";
    billEle.style.display = "none";
    updateQueryString('tab', 'admin');
}

async function fetchUsers() {
    try {
        const response = await fetch('/names'); // Replace with your API endpoint
        const users = await response.json();
        const tbody = document.querySelector('#adminTable tbody');
        tbody.innerHTML = ''; // Clear existing rows

        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name}</td>
                <td><button onclick="confirmDelete('${user.id}')">删除</button></td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        document.getElementById('updateStatus').innerText = 'Error loading users.';
    }
}

// show nav items
function toggleNav() {
    var x = document.getElementById("myLinks");
    if (x.style.display === "block") {
      x.style.display = "none";
    } else {
      x.style.display = "block";
    }
  }

  // 顯示訊息
function showMessage(message, type = "success") {
    const messageBox = document.getElementById("message-box");
    messageBox.textContent = message;
    messageBox.className = `message ${type}`;
    messageBox.style.display = "block";
    setTimeout(() => {
        messageBox.style.display = "none";
    }, 3000);
}


// update query params
function updateQueryString(key, value) {
    // Step 1: Get the current URL
    const currentUrl = window.location.href;
                
    // Step 2: Create a URL object
    const url = new URL(currentUrl);

    // Step 3: Create URLSearchParams object
    const params = new URLSearchParams(url.search);

    params.delete(key);
    // Step 4: Set or update query parameters
    params.set(key, value);  // Set or update param1

    // Step 5: Update the URL without reloading the page
    url.search = params.toString();
    window.history.pushState({}, '', url);

    console.log('Updated URL:', url.toString());
}