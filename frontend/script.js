document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("product-container");
  
    try {
      const res = await fetch("http://localhost:5000/api/products");
      const products = await res.json();
  
      products.forEach((product) => {
        const card = document.createElement("div");
        card.className = "product-card";
  
        const imgWrapper = document.createElement("div");
        imgWrapper.className = "img-wrapper";
        const img = document.createElement("img");
        img.src = product.images[0] || "";
        img.alt = product.name;
        imgWrapper.appendChild(img);
        card.appendChild(imgWrapper);
  
        const details = document.createElement("div");
        details.className = "product-details";
  
        const title = document.createElement("h3");
        title.textContent = product.name;
        details.appendChild(title);
  
        const price = document.createElement("p");
        price.textContent = `$${product.price}`;
        details.appendChild(price);
  
        const desc = document.createElement("p");
        desc.textContent = product.description;
        details.appendChild(desc);
  
        card.appendChild(details);
        container.appendChild(card);
      });
    } catch (err) {
      console.error("Error fetching products:", err);
      container.innerHTML = "<p>Failed to load products.</p>";
    }
})