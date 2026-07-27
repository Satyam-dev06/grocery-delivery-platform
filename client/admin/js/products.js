let currentProducts = [];
let currentPage = 1;
let totalPages = 1;
let currentSearch = "";
let currentCategory = "";
let currentBrand = "";
let currentSort = "newest";
let isLoading = false;
const ADMIN_LIMIT = 10;

async function loadProducts() {
  if (isLoading) return;
  isLoading = true;

  var content = document.getElementById("productsContent");
  content.innerHTML = '<div style="text-align:center;padding:40px;"><i class="fas fa-spinner fa-spin" style="font-size:32px;color:#2E7D32;"></i><p style="margin-top:15px;color:#888;">Loading products...</p></div>';

  // ── Timeout guard: if the request takes >10s, force a timeout ──
  var timedOut = false;
  var timeoutId = setTimeout(function () {
    timedOut = true;
    content.innerHTML = '<div class="empty-state">' +
      '<div class="empty-icon"><i class="fas fa-clock" style="color:#E65100;font-size:48px;"></i></div>' +
      '<h3>Request timed out</h3>' +
      '<p>The server took too long to respond. Please check your connection or try again.</p>' +
      '<button class="btn btn-primary" onclick="currentPage=1;loadProducts()" style="margin-top:15px;"><i class="fas fa-sync-alt"></i> Retry</button>' +
    '</div>';
    isLoading = false;
  }, 10000);

  try {
    var opts = {
      page: currentPage,
      limit: ADMIN_LIMIT,
      sort: currentSort,
    };
    if (currentSearch) opts.search = currentSearch;
    if (currentCategory) opts.category = currentCategory;
    if (currentBrand) opts.brand = currentBrand;

    var data = await fetchProducts(opts);

    // If we already timed out, bail out
    if (timedOut) return;

    currentProducts = data.products || [];
    var pagination = data.pagination || {};
    totalPages = pagination.totalPages || 1;

    renderProducts(pagination);
  } catch (e) {
    if (timedOut) return;
    content.innerHTML = '<div class="empty-state">' +
      '<div class="empty-icon"><i class="fas fa-exclamation-circle" style="color:#C62828;font-size:48px;"></i></div>' +
      '<h3>Unable to load products</h3>' +
      '<p>' + e.message.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</p>' +
      '<button class="btn btn-primary" onclick="currentPage=1;loadProducts()" style="margin-top:15px;"><i class="fas fa-sync-alt"></i> Retry</button>' +
      '<button class="btn btn-outline" onclick="console.clear()" style="margin-left:10px;margin-top:15px;"><i class="fas fa-terminal"></i> Clear Console</button>' +
    '</div>';
    console.error("[Admin Products] Failed to load:", e);
  } finally {
    clearTimeout(timeoutId);
    isLoading = false;
  }
}

function renderProducts(pagination) {
  var html = '<div class="admin-table-container">';

  // Search and filter bar
  html += '<div class="admin-toolbar" style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:20px;">' +
    '<div style="flex:1;min-width:200px;position:relative;">' +
      '<i class="fas fa-search" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#999;"></i>' +
      '<input id="adminSearchInput" type="text" placeholder="Search products..." value="'+currentSearch.replace(/"/g,'&quot;')+'" style="width:100%;padding:12px 14px 12px 40px;border:1px solid #ddd;border-radius:10px;font-size:15px;outline:none;" onkeyup="if(event.key===\'Enter\'){currentSearch=this.value;currentPage=1;loadProducts();}">' +
    '</div>' +
    '<select id="adminCategoryFilter" onchange="currentCategory=this.value;currentPage=1;loadProducts();" style="padding:12px;border:1px solid #ddd;border-radius:10px;font-size:14px;">' +
      '<option value="">All Categories</option>' +
      '<option value="Vegetables"'+(currentCategory==='Vegetables'?' selected':'')+'>Vegetables</option>' +
      '<option value="Fruits"'+(currentCategory==='Fruits'?' selected':'')+'>Fruits</option>' +
      '<option value="Dairy"'+(currentCategory==='Dairy'?' selected':'')+'>Dairy</option>' +
      '<option value="Bakery"'+(currentCategory==='Bakery'?' selected':'')+'>Bakery</option>' +
      '<option value="Beverages"'+(currentCategory==='Beverages'?' selected':'')+'>Beverages</option>' +
      '<option value="Meat"'+(currentCategory==='Meat'?' selected':'')+'>Meat</option>' +
      '<option value="Grains"'+(currentCategory==='Grains'?' selected':'')+'>Grains</option>' +
      '<option value="Personal Care"'+(currentCategory==='Personal Care'?' selected':'')+'>Personal Care</option>' +
    '</select>' +
    '<select id="adminSortSelect" onchange="currentSort=this.value;currentPage=1;loadProducts();" style="padding:12px;border:1px solid #ddd;border-radius:10px;font-size:14px;">' +
      '<option value="newest"'+(currentSort==='newest'?' selected':'')+'>Newest</option>' +
      '<option value="oldest"'+(currentSort==='oldest'?' selected':'')+'>Oldest</option>' +
      '<option value="price_low"'+(currentSort==='price_low'?' selected':'')+'>Price Low</option>' +
      '<option value="price_high"'+(currentSort==='price_high'?' selected':'')+'>Price High</option>' +
      '<option value="name_az"'+(currentSort==='name_az'?' selected':'')+'>Name A-Z</option>' +
      '<option value="name_za"'+(currentSort==='name_za'?' selected':'')+'>Name Z-A</option>' +
    '</select>' +
    '<button class="btn btn-secondary" onclick="currentSearch=\'\';document.getElementById(\'adminSearchInput\').value=\'\';currentCategory=\'\';document.getElementById(\'adminCategoryFilter\').value=\'\';currentSort=\'newest\';document.getElementById(\'adminSortSelect\').value=\'newest\';currentPage=1;loadProducts();" title="Clear filters"><i class="fas fa-undo"></i></button>' +
    '<button class="btn btn-primary" onclick="openProductModal()"><i class="fas fa-plus"></i> Add Product</button>' +
  '</div>';

  html += '<div class="admin-table-header"><h3><i class="fas fa-boxes"></i> Products' + (pagination ? ' ('+pagination.totalProducts+')' : ' ('+currentProducts.length+')') + '</h3></div>';

  if (!currentProducts.length) {
    html += '<div class="empty-state"><div class="empty-icon"><i class="fas fa-box-open"></i></div><p>No products found</p></div></div>';
    document.getElementById("productsContent").innerHTML = html;
    return;
  }

  html += '<div class="admin-table-wrapper"><table class="admin-table"><thead><tr><th><i class="fas fa-image"></i> Image</th><th><i class="fas fa-tag"></i> Name</th><th><i class="fas fa-folder"></i> Category</th><th><i class="fas fa-building"></i> Brand</th><th><i class="fas fa-indian-rupee-sign"></i> Price</th><th><i class="fas fa-check-circle"></i> Stock</th><th><i class="fas fa-star"></i> Featured</th><th><i class="fas fa-cog"></i> Actions</th></tr></thead><tbody>';
  currentProducts.forEach(function(p) {
    html += '<tr>' +
      '<td><img src="'+p.image+'" alt="'+p.name+'" style="width:40px;height:40px;object-fit:cover;border-radius:8px;" onerror="this.style.display=\'none\'"></td>' +
      '<td><strong>'+p.name+'</strong></td>' +
      '<td><span class="status-badge status-Confirmed"><i class="fas fa-folder"></i> '+p.category+'</span></td>' +
      '<td>'+(p.brand||'—')+'</td>' +
      '<td><strong>\u20B9'+(p.price||0).toLocaleString("en-IN")+'</strong></td>' +
      '<td>'+(p.stock?'<span class="status-badge status-Delivered"><i class="fas fa-check-circle"></i> In Stock</span>':'<span class="status-badge status-Cancelled"><i class="fas fa-times-circle"></i> Out</span>')+'</td>' +
      '<td>'+(p.featured?'<span style="color:#E65100;font-size:16px;"><i class="fas fa-star"></i></span>':'<span style="color:#ccc;"><i class="far fa-star"></i></span>')+'</td>' +
      '<td><div class="action-btns">' +
        '<button class="btn btn-primary btn-sm" onclick="editProduct(\''+p._id+'\')"><i class="fas fa-pen"></i> Edit</button> ' +
        '<button class="btn btn-danger btn-sm" onclick="deleteProduct(\''+p._id+'\')"><i class="fas fa-trash-alt"></i> Delete</button>' +
      '</div></td></tr>';
  });
  html += '</tbody></table></div>';

  // Pagination
  if (pagination && pagination.totalPages > 1) {
    html += '<div style="display:flex;justify-content:center;align-items:center;gap:8px;margin-top:20px;flex-wrap:wrap;">';
    html += '<button class="btn btn-sm" onclick="if(currentPage>1){currentPage--;loadProducts();}" '+(currentPage<=1?'disabled':'')+'><i class="fas fa-chevron-left"></i></button>';
    for (var i = 1; i <= pagination.totalPages; i++) {
      html += '<button class="btn btn-sm '+(i===currentPage?'btn-primary':'btn-secondary')+'" onclick="currentPage='+i+';loadProducts();">'+i+'</button>';
    }
    html += '<button class="btn btn-sm" onclick="if(currentPage<'+pagination.totalPages+'){currentPage++;loadProducts();}" '+(currentPage>=pagination.totalPages?'disabled':'')+'><i class="fas fa-chevron-right"></i></button>';
    html += '<span style="color:#888;font-size:13px;margin-left:10px;">Page '+currentPage+' of '+pagination.totalPages+'</span>';
    html += '</div>';
  }

  html += '</div>';
  document.getElementById("productsContent").innerHTML = html;
}

// ─── Init: load products on page mount ───
function initAdminProducts() { loadProducts(); }
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAdminProducts);
} else {
  initAdminProducts();
}

function openProductModal() {
  document.getElementById("editProductId").value = "";
  document.getElementById("productModalTitle").innerHTML = '<i class="fas fa-boxes"></i> Add Product';
  document.getElementById("productSaveBtn").innerHTML = '<i class="fas fa-check"></i> Save';
  document.getElementById("prodName").value = "";
  document.getElementById("prodCategory").value = "";
  document.getElementById("prodBrand").value = "";
  document.getElementById("prodDescription").value = "";
  document.getElementById("prodPrice").value = "";
  document.getElementById("prodOldPrice").value = "";
  document.getElementById("prodImage").value = "";
  document.getElementById("prodRating").value = "5";
  document.getElementById("prodStock").checked = true;
  document.getElementById("prodFeatured").checked = false;
  document.getElementById("prodTrending").checked = false;
  document.getElementById("prodRecommended").checked = false;
  document.getElementById("productModal").style.display = "flex";
  document.getElementById("prodName").focus();
}

function closeProductModal() {
  document.getElementById("productModal").style.display = "none";
}

async function editProduct(id) {
  try {
    var product = await fetchProductById(id);
    document.getElementById("editProductId").value = id;
    document.getElementById("productModalTitle").innerHTML = '<i class="fas fa-pen"></i> Edit Product';
    document.getElementById("productSaveBtn").innerHTML = '<i class="fas fa-save"></i> Update';
    document.getElementById("prodName").value = product.name || "";
    document.getElementById("prodCategory").value = product.category || "";
    document.getElementById("prodBrand").value = product.brand || "";
    document.getElementById("prodDescription").value = product.description || "";
    document.getElementById("prodPrice").value = product.price || "";
    document.getElementById("prodOldPrice").value = product.oldPrice || "";
    document.getElementById("prodImage").value = product.image || "";
    document.getElementById("prodRating").value = product.rating || "5";
    document.getElementById("prodStock").checked = product.stock !== false;
    document.getElementById("prodFeatured").checked = product.featured === true;
    document.getElementById("prodTrending").checked = product.trending === true;
    document.getElementById("prodRecommended").checked = product.recommended === true;
    document.getElementById("productModal").style.display = "flex";
    document.getElementById("prodName").focus();
  } catch (e) {
    alert("Failed to load product: " + e.message);
  }
}

async function saveProduct(event) {
  event.preventDefault();
  var id = document.getElementById("editProductId").value;
  var data = {
    name: document.getElementById("prodName").value.trim(),
    category: document.getElementById("prodCategory").value.trim(),
    brand: document.getElementById("prodBrand").value.trim(),
    description: document.getElementById("prodDescription").value.trim(),
    price: parseFloat(document.getElementById("prodPrice").value) || 0,
    oldPrice: parseFloat(document.getElementById("prodOldPrice").value) || 0,
    image: document.getElementById("prodImage").value.trim(),
    rating: parseFloat(document.getElementById("prodRating").value) || 5,
    stock: document.getElementById("prodStock").checked,
    featured: document.getElementById("prodFeatured").checked,
    trending: document.getElementById("prodTrending").checked,
    recommended: document.getElementById("prodRecommended").checked,
  };

  var saveBtn = document.getElementById("productSaveBtn");
  var originalText = saveBtn.innerHTML;
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  saveBtn.disabled = true;

  try {
    if (id) {
      await apiRequest("/products/" + id, { method: "PUT", body: JSON.stringify(data) });
    } else {
      await apiRequest("/products", { method: "POST", body: JSON.stringify(data) });
    }
    closeProductModal();
    loadProducts();
  } catch (e) {
    alert("Failed to save product: " + e.message);
  } finally {
    saveBtn.innerHTML = originalText;
    saveBtn.disabled = false;
  }
}

async function deleteProduct(id) {
  if (!confirm("Are you sure you want to delete this product?")) return;
  try {
    await apiRequest("/products/" + id, { method: "DELETE" });
    loadProducts();
  } catch (e) {
    alert("Failed to delete product: " + e.message);
  }
}
