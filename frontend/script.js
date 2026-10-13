
const API_URL = "https://the-stockguard.onrender.com/api/products";

const productForm = document.getElementById("productForm");
const searchInput = document.getElementById("searchInput");

function getStatus(expiryDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(expiryDate + "T00:00:00");
    const days = Math.round((expiry - today) / 86400000);

    if (days < 0) return "Expired";
    if (days <= 30) return "Expiring Soon";
    return "Safe";
}

function showMessage(text, success = true) {
    const message = document.getElementById("message");

    if (message) {
        message.textContent = text;
        message.style.color = success ? "#147c61" : "#d74747";
    }
}

async function fetchProducts(query = "") {
    const url = new URL(API_URL);

    if (query) {
        url.searchParams.set("q", query);
    }

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Could not load products.");
    }

    return await response.json();
}

function makeCell(row, text) {
    const cell = document.createElement("td");
    cell.textContent = text;
    row.appendChild(cell);
    return cell;
}

function renderTable(products, allowDelete = false) {
    const body = document.getElementById("inventoryBody");

    if (!body) return;

    body.replaceChildren();

    if (products.length === 0) {
        const row = document.createElement("tr");
        const cell = makeCell(row, "No products found.");

        cell.colSpan = allowDelete ? 6 : 5;
        cell.className = "empty";

        body.appendChild(row);
        return;
    }

    products.forEach(product => {
        const row = document.createElement("tr");
        const status = getStatus(product.expiryDate);

        makeCell(row, product.name);
        makeCell(row, product.category);
        makeCell(row, String(product.quantity));
        makeCell(row, product.expiryDate);

        const statusCell = makeCell(row, status);

        statusCell.className =
            status === "Expired" ? "status-expired" :
            status === "Expiring Soon" ? "status-warning" :
            "status-safe";

        if (allowDelete) {
            const actionCell = document.createElement("td");
            const button = document.createElement("button");

            button.type = "button";
            button.textContent = "Delete";
            button.className = "delete-button";

            button.addEventListener("click", async () => {
                if (!confirm(`Delete ${product.name}?`)) return;

                button.disabled = true;

                try {
                    const response = await fetch(
                        `${API_URL}/${product.id}`,
                        { method: "DELETE" }
                    );

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error || "Delete failed.");
                    }

                    showMessage("Product deleted successfully.");
                    await loadPage();
                } catch (error) {
                    showMessage(error.message, false);
                    button.disabled = false;
                }
            });

            actionCell.appendChild(button);
            row.appendChild(actionCell);
        }

        body.appendChild(row);
    });
}

function updateDashboard(products) {
    const total = document.getElementById("totalProducts");

    if (!total) return;

    total.textContent = products.length;

    document.getElementById("lowStock").textContent =
        products.filter(p => p.quantity < 10).length;

    document.getElementById("expiringSoon").textContent =
        products.filter(p =>
            getStatus(p.expiryDate) === "Expiring Soon"
        ).length;

    document.getElementById("expiredProducts").textContent =
        products.filter(p =>
            getStatus(p.expiryDate) === "Expired"
        ).length;
}

async function loadPage() {
    const page = document.body.dataset.page;

    try {
        if (page === "home") {
            const products = await fetchProducts();
            renderTable(products);
            updateDashboard(products);
        }

        if (page === "search") {
            const query = searchInput.value.trim();
            const products = await fetchProducts(query);

            renderTable(products);

            document.getElementById("resultCount").textContent =
                `${products.length} product(s) found.`;
        }

        if (page === "delete") {
            const products = await fetchProducts();
            renderTable(products, true);
        }
    } catch (error) {
        showMessage(
            "Cannot connect to the backend. Make sure Flask is running.",
            false
        );
        console.error(error);
    }
}

// Add Product page
if (productForm) {
    productForm.addEventListener("submit", async event => {
        event.preventDefault();

        const name = document.getElementById("productName").value.trim();
        const category = document.getElementById("category").value.trim();
        const quantity = Number(
            document.getElementById("quantity").value
        );
        const expiryDate = document.getElementById("expiryDate").value;

        if (
            !name ||
            !category ||
            !expiryDate ||
            !Number.isInteger(quantity) ||
            quantity < 0
        ) {
            showMessage("Please enter valid product details.", false);
            return;
        }

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    category,
                    quantity,
                    expiryDate
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Could not add product.");
            }

            productForm.reset();
            showMessage("Product saved to the database!");
        } catch (error) {
            showMessage(error.message, false);
        }
    });
}

// Search whenever the user types.
if (searchInput) {
    searchInput.addEventListener("input", loadPage);
}

// Load data when each page opens.
loadPage();
