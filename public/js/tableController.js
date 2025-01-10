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
            await reloadUser(result)
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

async function submitCreate() {
    const nameInput = document.getElementById('nameInput').value;

    // Check for invalid characters (symbols)
    const regex = /^[A-Za-z0-9 ]+$/; // Allows letters and numbers
    if (!regex.test(nameInput)) {
        alert('Please enter a valid name (letters and numbers only).');
        return;
    }
    
    await createUser(nameInput)

    // Close the modal
    $('#nameModal').modal('hide');
    
}

async function createUser(name) {
    try {
        const response = await fetch(`/names/create`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
            body: JSON.stringify({'name': name})
        });
        await response.json().then((result) => {
            if (result.error) {
                showMessage(result.error, "error")
            } 
            if (result.message) {
                showMessage(result.message)
                reloadUser()
            }
        });

        
    } catch {
        console.error('Error:', error);
        document.getElementById('updateStatus').innerText = 'Error creating user.';
    }
}

async function confirmCreate(userName) {
    if (confirm(`真的要添加此用户(${userName})嗎?`)) {
        await createUser(userName);
    }   
}

async function reloadUser(result){
    await fetchUsers().then(() => {
        if (result.message) {
            showMessage(result['message'])
        } else {
            result['error']
        } 
    })
}