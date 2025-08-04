class BillGenerator {
    constructor() {
        this.items = [];
        this.subtotal = 0;
        this.deliveryCharges = 0;
        this.finalTotal = 0;
        this.initializeEventListeners();
        this.setCurrentDate();
    }

    initializeEventListeners() {
        document.getElementById('addItemBtn').addEventListener('click', () => this.addItem());
        document.getElementById('generatePdfBtn').addEventListener('click', () => this.generatePDF());
        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('deliveryCharges').addEventListener('input', () => this.updateSummary());
        document.getElementById('freeDelivery').addEventListener('change', () => this.handleFreeDelivery());
        
        // Allow adding item with Enter key
        document.getElementById('quantity').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addItem();
            }
        });
    }

    handleFreeDelivery() {
        const freeDeliveryCheckbox = document.getElementById('freeDelivery');
        const deliveryChargesInput = document.getElementById('deliveryCharges');
        
        if (freeDeliveryCheckbox.checked) {
            deliveryChargesInput.value = '0';
            deliveryChargesInput.disabled = true;
        } else {
            deliveryChargesInput.disabled = false;
        }
        
        this.updateSummary();
    }

    setCurrentDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('invoiceDate').value = today;
    }

    addItem() {
        const itemSelect = document.getElementById('itemSelect');
        const quantityInput = document.getElementById('quantity');
        
        if (!itemSelect.value) {
            alert('Please select an item');
            return;
        }
        
        const [itemName, price] = itemSelect.value.split('|');
        const quantity = parseInt(quantityInput.value);
        
        if (quantity <= 0) {
            alert('Please enter a valid quantity');
            return;
        }
        
        const total = parseFloat(price) * quantity;
        
        const item = {
            id: Date.now(),
            name: itemName,
            price: parseFloat(price),
            quantity: quantity,
            total: total
        };
        
        this.items.push(item);
        this.renderItems();
        this.updateSummary();
        
        // Reset form
        itemSelect.value = '';
        quantityInput.value = '1';
    }

    removeItem(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.renderItems();
        this.updateSummary();
    }

    renderItems() {
        const tbody = document.querySelector('#itemsTable tbody');
        tbody.innerHTML = '';
        
        this.items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>₹${item.price}</td>
                <td>${item.quantity}</td>
                <td>₹${item.total}</td>
                <td>
                    <button class="remove-btn" onclick="billGenerator.removeItem(${item.id})">
                        Remove
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    updateSummary() {
        this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
        this.deliveryCharges = parseFloat(document.getElementById('deliveryCharges').value) || 0;
        this.finalTotal = this.subtotal + this.deliveryCharges;
        
        document.getElementById('subtotal').textContent = `Rs.${this.subtotal}`;
        document.getElementById('deliveryTotal').textContent = `Rs.${this.deliveryCharges}`;
        document.getElementById('finalTotal').textContent = `Rs.${this.finalTotal}`;
    }

    clearAll() {
        if (confirm('Are you sure you want to clear all items?')) {
            this.items = [];
            this.renderItems();
            this.updateSummary();
            
            // Clear customer details
            document.getElementById('customerName').value = '';
            document.getElementById('customerPhone').value = '';
            document.getElementById('deliveryAddress').value = '';
            document.getElementById('deliveryCharges').value = '0';
            document.getElementById('freeDelivery').checked = false;
            document.getElementById('deliveryCharges').disabled = false;
            this.setCurrentDate();
        }
    }

    generatePDF() {
        const customerName = document.getElementById('customerName').value;
        const customerPhone = document.getElementById('customerPhone').value;
        const deliveryAddress = document.getElementById('deliveryAddress').value;
        const invoiceDate = document.getElementById('invoiceDate').value;
        
        if (!customerName || !customerPhone || !deliveryAddress || this.items.length === 0) {
            alert('Please fill in customer details, delivery address and add at least one item');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        
        // Set up colors
        const primaryColor = [255, 107, 107]; // Red
        const secondaryColor = [52, 73, 94]; // Dark blue
        const textColor = [44, 62, 80]; // Dark gray
        
        // Header
        pdf.setFillColor(...primaryColor);
        pdf.rect(0, 0, 210, 40, 'F');
        
        // Business Name
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Village Kitchen', 20, 20);
        
        // Tagline
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'italic');
        pdf.text('Love at First Bite', 20, 28);
        
        // Phone
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Phone: +91 6305376320', 20, 35);
        
        // Invoice title
        pdf.setTextColor(...secondaryColor);
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text('INVOICE', 150, 20);
        
        // Invoice details
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Date: ${new Date(invoiceDate).toLocaleDateString()}`, 150, 30);
        pdf.text(`Invoice No: VK${Date.now().toString().slice(-6)}`, 150, 36);
        
        // Customer details
        pdf.setTextColor(...textColor);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Bill To:', 20, 55);
        
        pdf.setFont('helvetica', 'normal');
        pdf.text(customerName, 20, 63);
        pdf.text(`Phone: ${customerPhone}`, 20, 70);
        
        // Delivery address
        pdf.setFont('helvetica', 'bold');
        pdf.text('Delivery Address:', 20, 80);
        pdf.setFont('helvetica', 'normal');
        
        // Handle multi-line address
        const addressLines = pdf.splitTextToSize(deliveryAddress, 170);
        let addressY = 87;
        addressLines.forEach(line => {
            pdf.text(line, 20, addressY);
            addressY += 5;
        });
        
        // Table header
        let yPos = Math.max(addressY + 10, 105);
        pdf.setFillColor(240, 240, 240);
        pdf.rect(20, yPos - 5, 170, 10, 'F');
        
        pdf.setTextColor(...secondaryColor);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Item', 25, yPos);
        pdf.text('Price', 120, yPos);
        pdf.text('Qty', 145, yPos);
        pdf.text('Total', 165, yPos);
        
        // Table items
        yPos += 15;
        pdf.setTextColor(...textColor);
        pdf.setFont('helvetica', 'normal');
        
        this.items.forEach(item => {
            // Check if we need a new page
            if (yPos > 250) {
                pdf.addPage();
                yPos = 30;
            }
            
            // Wrap long item names
            const itemName = item.name.length > 35 ? 
                item.name.substring(0, 35) + '...' : item.name;
            
            pdf.text(itemName, 25, yPos);
            pdf.text(`Rs. ${item.price}`, 120, yPos);
            pdf.text(item.quantity.toString(), 145, yPos);
            pdf.text(`Rs. ${item.total}`, 165, yPos);
            
            yPos += 8;
        });
        
        // Summary
        yPos += 10;
        pdf.line(120, yPos, 190, yPos); // Line above total
        yPos += 10;
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.text('Subtotal:', 120, yPos);
        pdf.text(`Rs. ${this.subtotal}`, 165, yPos);
        
        yPos += 8;
        pdf.text('Delivery Charges:', 120, yPos);
        pdf.text(`Rs. ${this.deliveryCharges}`, 165, yPos);
        
        yPos += 8;
        pdf.setFontSize(14);
        pdf.setTextColor(...primaryColor);
        pdf.text('Total Amount:', 120, yPos);
        pdf.text(`Rs. ${this.finalTotal}`, 165, yPos);
        
        // Footer
        yPos += 30;
        pdf.setTextColor(...textColor);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'italic');
        pdf.text('Thanks for ordering from Village Kitchen!', 20, yPos);
        
        yPos += 10;
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text('This is a computer generated invoice.', 20, yPos);
        
        // Save PDF
        const cleanCustomerName = customerName.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `Village_Kitchen_Invoice_${cleanCustomerName}_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);
    }
}

// Initialize the bill generator
const billGenerator = new BillGenerator();
