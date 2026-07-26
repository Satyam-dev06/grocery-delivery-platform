let currentUserPage = 1;
let userTotalPages = 1;

async function loadUsers(page) {
  currentUserPage = page || 1;
  try {
    var search = document.getElementById("userSearch").value;
    var data = await adminFetchUsers(currentUserPage, search);
    userTotalPages = data.pages || 1;
    renderUsers(data);
  } catch(e) {
    document.getElementById("usersContent").innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="fas fa-exclamation-circle" style="color:#C62828;"></i></div><p>Error: '+e.message+'</p></div>';
  }
}

function renderUsers(data) {
  var html = '<div class="admin-table-container"><div class="admin-table-header"><h3><i class="fas fa-users"></i> Users ('+data.total+')</h3></div>';
  if (!data.users || !data.users.length) {
    html += '<div class="empty-state"><div class="empty-icon"><i class="fas fa-users"></i></div><p>No users found</p></div></div>';
    document.getElementById("usersContent").innerHTML = html;
    return;
  }
  html += '<div class="admin-table-wrapper"><table class="admin-table"><thead><tr><th><i class="fas fa-user"></i>Name</th><th><i class="fas fa-envelope"></i>Email</th><th><i class="fas fa-phone"></i>Phone</th><th><i class="fas fa-shield-alt"></i>Role</th><th><i class="fas fa-shopping-cart"></i>Orders</th><th><i class="fas fa-calendar"></i>Joined</th><th><i class="fas fa-cog"></i>Actions</th></tr></thead><tbody>';
  data.users.forEach(function(u) {
    html += '<tr>';
    html += '<td><strong>'+u.name+'</strong></td>';
    html += '<td>'+u.email+'</td>';
    html += '<td>'+(u.phone||'-')+'</td>';
    html += '<td><span class="status-badge '+(u.role==='admin'?'status-Confirmed':'status-Pending')+'"><i class="fas '+(u.role==='admin'?'fa-user-shield':'fa-user')+'"></i> '+u.role+'</span></td>';
    html += '<td><span class="status-badge status-Delivered"><i class="fas fa-shopping-cart"></i> '+ (u.orderCount||0) +'</span></td>';
    html += '<td>'+formatDate(u.createdAt)+'</td>';
    html += '<td><div class="action-btns">';
    html += '<button class="btn btn-primary btn-sm" onclick="openUserModal(\''+u._id+'\')"><i class="fas fa-pen"></i> Edit</button> ';
    if (u.role !== 'admin') {
      html += '<button class="btn btn-danger btn-sm" onclick="deleteUser(\''+u._id+'\')"><i class="fas fa-trash-alt"></i> Delete</button>';
    }
    html += '</div></td></tr>';
  });
  html += '</tbody></table></div></div>';
  if (userTotalPages > 1) {
    html += '<div class="pagination">';
    for (var i=1; i<=userTotalPages; i++) {
      html += '<button class="'+(i===currentUserPage?'active':'')+'" onclick="loadUsers('+i+')" aria-label="Page '+i+'">'+i+'</button>';
    }
    html += '</div>';
  }
  document.getElementById("usersContent").innerHTML = html;
}

function openUserModal(id) {
  document.getElementById("editUserId").value = id;
  document.getElementById("userName").value = "";
  document.getElementById("userEmail").value = "";
  document.getElementById("userPhone").value = "";
  document.getElementById("userRole").value = "user";
  document.getElementById("userModal").classList.add("active");
}

function closeUserModal() {
  document.getElementById("userModal").classList.remove("active");
}

async function saveUser() {
  var id = document.getElementById("editUserId").value;
  var data = {
    name: document.getElementById("userName").value,
    email: document.getElementById("userEmail").value,
    phone: document.getElementById("userPhone").value,
    role: document.getElementById("userRole").value,
  };
  try {
    await adminUpdateUser(id, data);
    showAdminToast("User updated");
    closeUserModal();
    loadUsers(currentUserPage);
  } catch(e) {
    showAdminToast(e.message, "error");
  }
}

async function deleteUser(id) {
  var ok = await showConfirm("Delete this user? All their data will be lost.");
  if (!ok) return;
  try {
    await adminDeleteUser(id);
    showAdminToast("User deleted");
    loadUsers(currentUserPage);
  } catch(e) {
    showAdminToast(e.message, "error");
  }
}

loadUsers(1);
