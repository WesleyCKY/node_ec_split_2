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
        const result = await response.json();

        if (result) {
            console.log(result.message)
            // Remove the user from the table
            await fetchUsers().then(() => showMessage(result['message']));; // Refresh the list
        } 
        else {
            console.error('Error creating user:', result.statusText);
            showMessage(result.statusText);
            document.getElementById('updateStatus').innerText = 'Error creating user.';
        }
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