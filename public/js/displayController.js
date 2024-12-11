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

// Function to confirm delete action
async function confirmDelete(userId) {
    if (confirm('真的要删除此用户嗎?')) {
        await deleteUser(userId);
    }   
}

// Function to delete a user
async function deleteUser(userId) {
    try {
        const response = await fetch(`/names/delete`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
            body: JSON.stringify({'id': userId})
        });
        const result = await response.json();

        if (result) {
            console.log(result.message)
            // Remove the user from the table
            await fetchUsers().then(() => showMessage(result['message']));; // Refresh the list
        } 
        else {
            console.error('Error deleting user:', result.statusText);
            showMessage(result.statusText);
            document.getElementById('updateStatus').innerText = 'Error deleting user.';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('updateStatus').innerText = 'Error deleting user.';
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