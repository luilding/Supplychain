document.addEventListener("DOMContentLoaded", () => {
    App.start();
});

const App = {
    web3Provider: null,
    account: null,
    supplyChain: null,
    
	//Starting the application
    start: async function() {
        await this.connectToBlockchain();
        await this.loadAccount();
        await this.loadContract();
        await this.updateAccountDisplay();
        await this.displayOwnedProducts();
        this.attachEventListeners();
    },
	
	//Connecting to ethereum using metamask
    connectToBlockchain: async function() {
        if (window.ethereum) {
            this.web3Provider = window.ethereum;
            try {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
            } catch (error) {
                console.error("Failed to connect to Ethereum:", error);
            }
        } else {
            console.log('Please install MetaMask!');
        }
        window.web3 = new Web3(this.web3Provider);
    },

	//Loads users etherum account
    loadAccount: async function() {
        const accounts = await web3.eth.getAccounts();
        this.account = accounts[0];
    },
    
	//Loads the supplychain smart contract
    loadContract: async function() {
        const response = await fetch('SupplyChain.json');
        const supplyChainJson = await response.json();
        const SupplyChain = TruffleContract(supplyChainJson);
        SupplyChain.setProvider(this.web3Provider);
        this.supplyChain = await SupplyChain.deployed();
    },
    
    //Update display to show current account address
    updateAccountDisplay: function() {
        document.getElementById('account').textContent = this.account;
    },
    
    //Add event listeners to UI
    attachEventListeners: function() {
        const addProductButton = document.getElementById('addProductButton');
        if (addProductButton) {
            addProductButton.addEventListener('click', this.addProduct.bind(this));
        }
    },    

	//For adding products taking the name and origin
    addProduct: async function() {
        const addButton = document.getElementById('addProductButton');
        const nameInput = document.getElementById('productName');
        const originInput = document.getElementById('productOrigin');

        if (!addButton || !nameInput || !originInput) {
            console.error("Required elements not found");
            return;
        }

        addButton.disabled = true;
        
        try {
            const name = nameInput.value;
            const origin = originInput.value;
            const result = await this.supplyChain.addProduct(name, origin, { from: this.account });
            const productId = result.logs[0].args.id.toNumber();
            alert(`Product added! ID: ${productId}`);
            await this.displayOwnedProducts();
        } catch (error) {
            console.error("Error adding product:", error);
        } finally {
            addButton.disabled = false;
        }
    },
            
	
	//Transfering the ownership of a specified product to a new address
    transferOwnership: async function() {
        const id = document.getElementById('productId').value;
        const newOwner = document.getElementById('newOwner').value;
        try {
            await this.supplyChain.transferOwnership(id, newOwner, { from: this.account });
            alert('Ownership transferred!');
            await this.displayOwnedProducts(); 
        } catch (error) {
            console.error("Error transferring ownership:", error);
            alert("Failed to transfer ownership. Are you the current owner?");
        }
    },

	//Gets and displays information for a specified product ID
    getProductInfo: async function() {
        const id = document.getElementById('productInfoId').value;
        try {
            const product = await this.supplyChain.getProduct(id);
            const info = `ID: ${product[0]}<br>Name: ${product[1]}<br>Origin: ${product[2]}<br>Current Owner: ${product[3]}`;
            document.getElementById('productInfo').innerHTML = info;
            await this.getMovements(id);
        } catch (error) {
            console.error("Error getting product info:", error);
            document.getElementById('productInfo').innerHTML = "Product not found";
        }
    },

	//Gets and displays the movement history for a product
    getMovements: async function(id) {
        try {
            const movements = await this.supplyChain.getMovements(id);
            const actions = movements[0].split("; ");
            const actors = movements[1];
            const timestamps = movements[2];
            let movementInfo = "";
            for (let i = 0; i < actions.length - 1; i++) {
                const date = new Date(timestamps[i] * 1000).toLocaleString();
                movementInfo += `Action: ${actions[i]}<br>Actor: ${actors[i]}<br>Date: ${date}<br><br>`;
            }
            document.getElementById('movementInfo').innerHTML = movementInfo;
        } catch (error) {
            console.error("Error getting movements:", error);
        }
    },

	//Displays all products owned by the current user
    displayOwnedProducts: async function() {
        try {
            const ownedProducts = await this.supplyChain.getProductsOwnedBy(this.account);
            let ownedProductsHtml = "<h3>Your Products:</h3><ul>";
            for (let i = 0; i < ownedProducts.length; i++) {
                const productId = ownedProducts[i].toNumber();
                const product = await this.supplyChain.getProduct(productId);
                ownedProductsHtml += `<li>ID: ${productId}, Name: ${product[1]}</li>`;
            }
            ownedProductsHtml += "</ul>";
            document.getElementById('ownedProducts').innerHTML = ownedProductsHtml;
        } catch (error) {
            console.error("Error displaying owned products:", error);
        }
    }
};
