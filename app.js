/* =====================================================
   SUPABASE
===================================================== */

const SUPABASE_URL =
  "https://neuppeogxxekbomdqqee.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_ZIxsvk8pd2zvUG6AL6LJgw_9pxq5_nq";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );


/* =====================================================
   STATE
===================================================== */

let currentUser = null;
let currentUserRole = "agent";

let leads = [];
let properties = [];

let authMode = "login";


/* =====================================================
   ELEMENTS
===================================================== */

const authScreen =
  document.getElementById("authScreen");

const appScreen =
  document.getElementById("appScreen");

const agentDashboard =
  document.getElementById("agentDashboard");

const adminDashboard =
  document.getElementById("adminDashboard");

const authForm =
  document.getElementById("authForm");

const authEmail =
  document.getElementById("authEmail");

const authPassword =
  document.getElementById("authPassword");

const authSubmit =
  document.getElementById("authSubmit");

const authMessage =
  document.getElementById("authMessage");

const loginTab =
  document.getElementById("loginTab");

const signupTab =
  document.getElementById("signupTab");

const forgotPasswordBtn =
  document.getElementById("forgotPasswordBtn");

const resetPasswordForm =
  document.getElementById("resetPasswordForm");

const newPassword =
  document.getElementById("newPassword");

const confirmNewPassword =
  document.getElementById("confirmNewPassword");

const saveNewPasswordBtn =
  document.getElementById("saveNewPasswordBtn");

const cancelPasswordResetBtn =
  document.getElementById("cancelPasswordResetBtn");

const authTabs =
  document.querySelector(".auth-tabs");

const logoutBtn =
  document.getElementById("logoutBtn");

const userEmail =
  document.getElementById("userEmail");

const roleBadge =
  document.getElementById("roleBadge");

const leadForm =
  document.getElementById("leadForm");

const propertyForm =
  document.getElementById("propertyForm");

const cancelLeadEdit =
  document.getElementById("cancelLeadEdit");

const cancelPropertyEdit =
  document.getElementById("cancelPropertyEdit");


/* =====================================================
   AUTH UI
===================================================== */

function showAuth() {

  authScreen.classList.remove("hidden");
  appScreen.classList.add("hidden");

}

function showApp() {

  authScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");

  userEmail.textContent =
    currentUser?.email || "";

  roleBadge.textContent =
    currentUserRole === "admin"
      ? "Admin"
      : "Agent";

}

function showMessage(text, error = false) {

  authMessage.textContent = text;

  authMessage.style.color =
    error ? "#dc2626" : "#16a34a";

}

function showPasswordResetForm() {
  authScreen.classList.remove("hidden");
  appScreen.classList.add("hidden");

  authForm.classList.add("hidden");
  resetPasswordForm.classList.remove("hidden");
  forgotPasswordBtn.classList.add("hidden");
  authTabs.classList.add("hidden");

  showMessage("Enter and confirm your new password.");
}

function showLoginForm() {
  authForm.classList.remove("hidden");
  resetPasswordForm.classList.add("hidden");
  forgotPasswordBtn.classList.remove("hidden");
  authTabs.classList.remove("hidden");

  authPassword.value = "";
  newPassword.value = "";
  confirmNewPassword.value = "";

  showAuth();
  showMessage("");
}


/* =====================================================
   AUTH MODE
===================================================== */

loginTab.addEventListener("click", () => {

  authMode = "login";

  loginTab.classList.add("active");
  signupTab.classList.remove("active");

  authSubmit.textContent = "Login";

  showMessage("");

});


signupTab.addEventListener("click", () => {

  authMode = "signup";

  signupTab.classList.add("active");
  loginTab.classList.remove("active");

  authSubmit.textContent =
    "Create Account";

  showMessage("");

});

forgotPasswordBtn.addEventListener("click", async () => {
  const email = authEmail.value.trim();

  if (!email) {
    showMessage("Enter your email address first.", true);
    authEmail.focus();
    return;
  }

  forgotPasswordBtn.disabled = true;

  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: "https://breezycodez-cyber.github.io/Breezy-/"
      }
    );

    if (error) throw error;

    showMessage(
      "If an account exists for this email, check your inbox and spam folder for the reset link."
    );
  } catch (error) {
    console.error(error);
    showMessage(error.message || "Could not send the reset email.", true);
  } finally {
    forgotPasswordBtn.disabled = false;
  }
});

resetPasswordForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const password = newPassword.value;
  const confirmation = confirmNewPassword.value;

  if (password.length < 6) {
    showMessage("Password must contain at least 6 characters.", true);
    return;
  }

  if (password !== confirmation) {
    showMessage("The passwords do not match.", true);
    return;
  }

  saveNewPasswordBtn.disabled = true;

  try {
    const { error } = await supabaseClient.auth.updateUser({
      password: password
    });

    if (error) throw error;

    await supabaseClient.auth.signOut();

    showLoginForm();
    showMessage("Password changed successfully. You can now log in.");
  } catch (error) {
    console.error(error);
    showMessage(error.message || "Password update failed. Try the latest reset email.", true);
  } finally {
    saveNewPasswordBtn.disabled = false;
  }
});

cancelPasswordResetBtn.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  showLoginForm();
});


/* =====================================================
   SIGNUP / LOGIN
===================================================== */

authForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    const email =
      authEmail.value.trim();

    const password =
      authPassword.value;


    authSubmit.disabled = true;

    authSubmit.textContent =
      "Please wait...";


    try {

      if (authMode === "signup") {

        const {
          data,
          error
        } =
          await supabaseClient.auth.signUp({
            email,
            password
          });


        if (error)
          throw error;


        if (data.session) {

          currentUser =
            data.user;

          await startApplication();

        } else {

          showMessage(
            "Account created. Check your email to verify your account, then log in."
          );

        }

      } else {

        const {
          data,
          error
        } =
          await supabaseClient.auth.signInWithPassword({
            email,
            password
          });


        if (error)
          throw error;


        currentUser =
          data.user;

        await startApplication();

      }


    } catch (error) {

      console.error(error);

      showMessage(
        error.message ||
        "Something went wrong.",
        true
      );

    } finally {

      authSubmit.disabled = false;

      authSubmit.textContent =
        authMode === "login"
          ? "Login"
          : "Create Account";

    }

  }
);


/* =====================================================
   LOAD USER ROLE
===================================================== */

async function loadUserRole() {

  currentUserRole = "agent";


  if (!currentUser)
    return;


  const {
    data,
    error
  } =
    await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUser.id)
      .maybeSingle();


  if (error) {

    console.error(
      "Role error:",
      error
    );

    return;

  }


  if (data) {

    currentUserRole =
      data.role === "admin"
        ? "admin"
        : "agent";

  }

}


/* =====================================================
   START APPLICATION
===================================================== */

async function startApplication() {

  if (!currentUser)
    return;


  await loadUserRole();


  showApp();


  if (currentUserRole === "admin") {

    /*
      Admin can see the administration
      interface.
    */

    agentDashboard.classList.add("hidden");

    adminDashboard.classList.remove("hidden");

    await loadAdminStats();

    await loadAdminUsers();

  } else {

    /*
      Normal agents only get their
      own workspace.
    */

    agentDashboard.classList.remove("hidden");

    adminDashboard.classList.add("hidden");

    await loadCloudData();

    renderEverything();

  }

}


/* =====================================================
   LOGOUT
===================================================== */

logoutBtn.addEventListener(
  "click",
  async () => {

    await supabaseClient.auth.signOut();

    currentUser = null;
    currentUserRole = "agent";

    leads = [];
    properties = [];

    showAuth();

  }
);


/* =====================================================
   AUTH STATE
===================================================== */

supabaseClient.auth.onAuthStateChange(
  (event, session) => {

    setTimeout(
      async () => {

if (event === "PASSWORD_RECOVERY") {
  showPasswordResetForm();
  return;
}
        if (session) {

          currentUser =
            session.user;

          await startApplication();

        } else {

          currentUser = null;

          showAuth();

        }

      },
      0
    );

  }
);


/* =====================================================
   CLOUD DATA
===================================================== */

async function loadCloudData() {

  if (!currentUser)
    return;


  try {

    const [
      leadResult,
      propertyResult
    ] =
      await Promise.all([

        supabaseClient
          .from("leads")
          .select("*")
          .order(
            "created_at",
            {
              ascending: false
            }
          ),

        supabaseClient
          .from("properties")
          .select("*")
          .order(
            "created_at",
            {
              ascending: false
            }
          )

      ]);


    if (leadResult.error)
      throw leadResult.error;

    if (propertyResult.error)
      throw propertyResult.error;


    leads =
      leadResult.data || [];

    properties =
      propertyResult.data || [];


  } catch (error) {

    console.error(error);

    alert(
      "Unable to load cloud data:\n" +
      error.message
    );

  }

}


/* =====================================================
   LEAD SAVE
===================================================== */

leadForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    if (!currentUser)
      return;


    const id =
      document.getElementById(
        "leadId"
      ).value;


    const payload = {

      name:
        document.getElementById(
          "leadName"
        ).value.trim(),

      phone:
        document.getElementById(
          "leadPhone"
        ).value.trim(),

      purpose:
        document.getElementById(
          "leadPurpose"
        ).value,

      property_type:
        document.getElementById(
          "leadPropertyType"
        ).value,

      location:
        document.getElementById(
          "leadLocation"
        ).value.trim(),

      budget:
        Number(
          document.getElementById(
            "leadBudget"
          ).value
        ) || 0,

      bedrooms:
        Number(
          document.getElementById(
            "leadBedrooms"
          ).value
        ) || 0,

      notes:
        document.getElementById(
          "leadNotes"
        ).value.trim(),

      status:
        document.getElementById(
          "leadStatus"
        ).value,

      followup:
        document.getElementById(
          "followupDate"
        ).value || null,

      updated_at:
        new Date().toISOString()

    };


    try {

      let result;


      if (id) {

        result =
          await supabaseClient
            .from("leads")
            .update(payload)
            .eq("id", id)
            .eq(
              "user_id",
              currentUser.id
            )
            .select()
            .single();

      } else {

        result =
          await supabaseClient
            .from("leads")
            .insert({
              ...payload,
              user_id:
                currentUser.id
            })
            .select()
            .single();

      }


      if (result.error)
        throw result.error;


      resetLeadForm();

      await loadCloudData();

      renderEverything();


    } catch (error) {

      alert(
        "Could not save lead:\n" +
        error.message
      );

    }

  }
);


/* =====================================================
   PROPERTY SAVE
===================================================== */

propertyForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    if (!currentUser)
      return;


    const id =
      document.getElementById(
        "propertyId"
      ).value;


    const payload = {

      name:
        document.getElementById(
          "propertyName"
        ).value.trim(),

      property_type:
        document.getElementById(
          "propertyType"
        ).value,

      location:
        document.getElementById(
          "propertyLocation"
        ).value.trim(),

      price:
        Number(
          document.getElementById(
            "propertyPrice"
          ).value
        ) || 0,

      bedrooms:
        Number(
          document.getElementById(
            "propertyBedrooms"
          ).value
        ) || 0,

      status:
        document.getElementById(
          "propertyStatus"
        ).value,

      updated_at:
        new Date().toISOString()

    };


    try {

      let result;


      if (id) {

        result =
          await supabaseClient
            .from("properties")
            .update(payload)
            .eq("id", id)
            .eq(
              "user_id",
              currentUser.id
            )
            .select()
            .single();

      } else {

        result =
          await supabaseClient
            .from("properties")
            .insert({
              ...payload,
              user_id:
                currentUser.id
            })
            .select()
            .single();

      }


      if (result.error)
        throw result.error;


      resetPropertyForm();

      await loadCloudData();

      renderEverything();


    } catch (error) {

      alert(
        "Could not save property:\n" +
        error.message
      );

    }

  }
);


/* =====================================================
   DELETE LEAD
===================================================== */

async function deleteLead(id) {

  if (
    !confirm(
      "Delete this lead?"
    )
  )
    return;


  const {
    error
  } =
    await supabaseClient
      .from("leads")
      .delete()
      .eq("id", id)
      .eq(
        "user_id",
        currentUser.id
      );


  if (error) {

    alert(error.message);

    return;

  }


  await loadCloudData();

  renderEverything();

}


/* =====================================================
   DELETE PROPERTY
===================================================== */

async function deleteProperty(id) {

  if (
    !confirm(
      "Delete this property?"
    )
  )
    return;


  const {
    error
  } =
    await supabaseClient
      .from("properties")
      .delete()
      .eq("id", id)
      .eq(
        "user_id",
        currentUser.id
      );


  if (error) {

    alert(error.message);

    return;

  }


  await loadCloudData();

  renderEverything();

}


/* =====================================================
   EDIT LEAD
===================================================== */

function editLead(id) {

  const lead =
    leads.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!lead)
    return;


  document.getElementById(
    "leadId"
  ).value = lead.id;

  document.getElementById(
    "leadName"
  ).value = lead.name || "";

  document.getElementById(
    "leadPhone"
  ).value = lead.phone || "";

  document.getElementById(
    "leadPurpose"
  ).value =
    lead.purpose || "Rent";

  document.getElementById(
    "leadPropertyType"
  ).value =
    lead.property_type ||
    "Apartment";

  document.getElementById(
    "leadLocation"
  ).value =
    lead.location || "";

  document.getElementById(
    "leadBudget"
  ).value =
    lead.budget || 0;

  document.getElementById(
    "leadBedrooms"
  ).value =
    lead.bedrooms || 0;

  document.getElementById(
    "leadNotes"
  ).value =
    lead.notes || "";

  document.getElementById(
    "leadStatus"
  ).value =
    lead.status || "Cold";

  document.getElementById(
    "followupDate"
  ).value =
    lead.followup || "";


  cancelLeadEdit
    .classList
    .remove("hidden");


  window.scrollTo({
    top:
      leadForm.offsetTop - 20,
    behavior: "smooth"
  });

}


/* =====================================================
   EDIT PROPERTY
===================================================== */

function editProperty(id) {

  const property =
    properties.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!property)
    return;


  document.getElementById(
    "propertyId"
  ).value =
    property.id;

  document.getElementById(
    "propertyName"
  ).value =
    property.name || "";

  document.getElementById(
    "propertyType"
  ).value =
    property.property_type ||
    "Apartment";

  document.getElementById(
    "propertyLocation"
  ).value =
    property.location || "";

  document.getElementById(
    "propertyPrice"
  ).value =
    property.price || 0;

  document.getElementById(
    "propertyBedrooms"
  ).value =
    property.bedrooms || 0;

  document.getElementById(
    "propertyStatus"
  ).value =
    property.status ||
    "Available";


  cancelPropertyEdit
    .classList
    .remove("hidden");


  window.scrollTo({
    top:
      propertyForm.offsetTop - 20,
    behavior: "smooth"
  });

}


/* =====================================================
   RESET FORMS
===================================================== */

cancelLeadEdit.addEventListener(
  "click",
  resetLeadForm
);

cancelPropertyEdit.addEventListener(
  "click",
  resetPropertyForm
);


function resetLeadForm() {

  leadForm.reset();

  document.getElementById(
    "leadId"
  ).value = "";

  cancelLeadEdit
    .classList
    .add("hidden");

}


function resetPropertyForm() {

  propertyForm.reset();

  document.getElementById(
    "propertyId"
  ).value = "";

  cancelPropertyEdit
    .classList
    .add("hidden");

}


/* =====================================================
   WHATSAPP
===================================================== */

function openWhatsApp(
  phone,
  name = ""
) {

  let number =
    String(phone)
      .replace(/\D/g, "");


  if (
    number.startsWith("0")
  ) {

    number =
      "256" +
      number.substring(1);

  }


  const message =
    `Hello ${name}, I have an update about a property that may interest you.`;


  const url =
    `https://wa.me/${number}?text=${encodeURIComponent(message)}`;


  window.open(
    url,
    "_blank"
  );

}


/* =====================================================
   RENDER
===================================================== */

function renderEverything() {

  renderDashboard();

  renderLeads();

  renderProperties();

  renderFollowups();

  renderMatches();

}


/* =====================================================
   DASHBOARD
===================================================== */

function renderDashboard() {

  document.getElementById(
    "leadCount"
  ).textContent =
    leads.length;


  document.getElementById(
    "propertyCount"
  ).textContent =
    properties.length;


  document.getElementById(
    "hotLeadCount"
  ).textContent =
    leads.filter(
      lead =>
        lead.status === "Hot"
    ).length;


  document.getElementById(
    "followupCount"
  ).textContent =
    leads.filter(
      lead =>
        lead.followup
    ).length;

}


/* =====================================================
   LEADS
===================================================== */

function renderLeads() {

  const container =
    document.getElementById(
      "leadList"
    );


  const search =
    document.getElementById(
      "leadSearch"
    )
    .value
    .toLowerCase()
    .trim();


  const filter =
    document.getElementById(
      "leadFilter"
    ).value;


  const filtered =
    leads.filter(
      lead => {

        const text =
          `${lead.name}
           ${lead.phone}
           ${lead.location}
           ${lead.property_type}`
          .toLowerCase();


        return (
          text.includes(search) &&
          (
            filter === "All" ||
            lead.status === filter
          )
        );

      }
    );


  if (!filtered.length) {

    container.innerHTML =
      `<p class="muted">No leads found.</p>`;

    return;

  }


  container.innerHTML =
    filtered.map(
      lead => `

        <div class="item">

          <h3>
            ${escapeHtml(
              lead.name
            )}
          </h3>

          <p>
            📞 ${escapeHtml(
              lead.phone
            )}
          </p>

          <p>
            ${escapeHtml(
              lead.purpose
            )}
            •
            ${escapeHtml(
              lead.property_type
            )}
            •
            ${escapeHtml(
              lead.location
            )}
          </p>

          <p>
            Budget:
            ${formatMoney(
              lead.budget
            )}
          </p>

          <p>
            Bedrooms:
            ${lead.bedrooms}
          </p>

          <p>
            Status:
            <strong>
              ${escapeHtml(
                lead.status
              )}
            </strong>
          </p>

          ${
            lead.followup
              ? `
                <p>
                  📅 Follow-up:
                  ${lead.followup}
                </p>
              `
              : ""
          }

          ${
            lead.notes
              ? `
                <p>
                  ${escapeHtml(
                    lead.notes
                  )}
                </p>
              `
              : ""
          }

          <div class="item-actions">

            <button
              class="edit-btn"
              onclick="editLead('${lead.id}')"
            >
              Edit
            </button>

            <button
              class="whatsapp-btn"
              onclick="openWhatsApp(
                '${escapeAttr(
                  lead.phone
                )}',
                '${escapeAttr(
                  lead.name
                )}'
              )"
            >
              WhatsApp
            </button>

            <button
              class="delete-btn"
              onclick="deleteLead('${lead.id}')"
            >
              Delete
            </button>

          </div>

        </div>

      `
    ).join("");

}


/* =====================================================
   PROPERTIES
===================================================== */

function renderProperties() {

  const container =
    document.getElementById(
      "propertyList"
    );


  const search =
    document.getElementById(
      "propertySearch"
    )
    .value
    .toLowerCase()
    .trim();


  const filter =
    document.getElementById(
      "propertyFilter"
    ).value;


  const filtered =
    properties.filter(
      property => {

        const text =
          `${property.name}
           ${property.location}
           ${property.property_type}`
          .toLowerCase();


        return (
          text.includes(search) &&
          (
            filter === "All" ||
            property.status === filter
          )
        );

      }
    );


  if (!filtered.length) {

    container.innerHTML =
      `<p class="muted">No properties found.</p>`;

    return;

  }


  container.innerHTML =
    filtered.map(
      property => `

        <div class="item">

          <h3>
            ${escapeHtml(
              property.name
            )}
          </h3>

          <p>
            ${escapeHtml(
              property.property_type
            )}
            •
            ${escapeHtml(
              property.location
            )}
          </p>

          <p>
            Price:
            ${formatMoney(
              property.price
            )}
          </p>

          <p>
            Bedrooms:
            ${property.bedrooms}
          </p>

          <p>
            Status:
            <strong>
              ${escapeHtml(
                property.status
              )}
            </strong>
          </p>

          <div class="item-actions">

            <button
              class="edit-btn"
              onclick="editProperty('${property.id}')"
            >
              Edit
            </button>

            <button
              class="delete-btn"
              onclick="deleteProperty('${property.id}')"
            >
              Delete
            </button>

          </div>

        </div>

      `
    ).join("");

}


/* =====================================================
   FOLLOW UPS
===================================================== */

function renderFollowups() {

  const container =
    document.getElementById(
      "followupList"
    );


  const followups =
    leads
      .filter(
        lead =>
          lead.followup
      )
      .sort(
        (a, b) =>
          new Date(a.followup) -
          new Date(b.followup)
      );


  if (!followups.length) {

    container.innerHTML =
      `<p class="muted">No follow-ups scheduled.</p>`;

    return;

  }


  const today =
    getToday();


  container.innerHTML =
    followups.map(
      lead => {

        let className =
          "followup-scheduled";

        let label =
          "Scheduled";


        if (
          lead.followup <
          today
        ) {

          className =
            "followup-overdue";

          label =
            "Overdue";

        }
        else if (
          lead.followup ===
          today
        ) {

          className =
            "followup-today";

          label =
            "Today";

        }


        return `

          <div
            class="item ${className}"
          >

            <strong>
              ${escapeHtml(
                lead.name
              )}
            </strong>

            <p>
              ${label}:
              ${lead.followup}
            </p>

            <button
              class="whatsapp-btn"
              onclick="openWhatsApp(
                '${escapeAttr(
                  lead.phone
                )}',
                '${escapeAttr(
                  lead.name
                )}'
              )"
            >
              WhatsApp
            </button>

          </div>

        `;

      }
    ).join("");

}


/* =====================================================
   PROPERTY MATCHING
===================================================== */

function renderMatches() {

  const container =
    document.getElementById(
      "matchList"
    );


  const available =
    properties.filter(
      property =>
        property.status ===
        "Available"
    );


  const matches = [];


  leads.forEach(
    lead => {

      available.forEach(
        property => {

          const typeMatch =
            normalize(
              lead.property_type
            ) ===
            normalize(
              property.property_type
            );


          const locationMatch =
            normalize(
              lead.location
            ) ===
            normalize(
              property.location
            );


          const priceMatch =
            Number(
              property.price
            ) <=
            Number(
              lead.budget
            );


          const bedroomMatch =
            Number(
              property.bedrooms
            ) >=
            Number(
              lead.bedrooms
            );


          if (
            typeMatch &&
            locationMatch &&
            priceMatch &&
            bedroomMatch
          ) {

            matches.push({
              lead,
              property
            });

          }

        }
      );

    }
  );


  if (!matches.length) {

    container.innerHTML =
      `<p class="muted">No property matches yet.</p>`;

    return;

  }


  container.innerHTML =
    matches.map(
      match => `

        <div class="match-item">

          <h3>
            🎯
            ${escapeHtml(
              match.lead.name
            )}
          </h3>

          <p>
            <strong>
              Property:
            </strong>
            ${escapeHtml(
              match.property.name
            )}
          </p>

          <p>
            ${escapeHtml(
              match.property.location
            )}
            •
            ${escapeHtml(
              match.property.property_type
            )}
          </p>

          <p>
            Price:
            ${formatMoney(
              match.property.price
            )}
          </p>

          <p>
            Bedrooms:
            ${match.property.bedrooms}
          </p>

          <button
            class="whatsapp-btn"
            onclick="openWhatsApp(
              '${escapeAttr(
                match.lead.phone
              )}',
              '${escapeAttr(
                match.lead.name
              )}'
            )"
          >
            Contact Lead
          </button>

        </div>

      `
    ).join("");

}


/* =====================================================
   ADMIN STATISTICS
===================================================== */

async function loadAdminStats() {

  const {
    data,
    error
  } =
    await supabaseClient.rpc(
      "get_admin_stats"
    );


  if (error) {

    console.error(
      "Admin stats:",
      error
    );

    return;

  }


  document.getElementById(
    "adminTotalUsers"
  ).textContent =
    data.total_users;


  document.getElementById(
    "adminTotalAgents"
  ).textContent =
    data.total_agents;


  document.getElementById(
    "adminTotalLeads"
  ).textContent =
    data.total_leads;


  document.getElementById(
    "adminTotalProperties"
  ).textContent =
    data.total_properties;

}


/* =====================================================
   ADMIN USERS
===================================================== */

async function loadAdminUsers() {

  const container =
    document.getElementById(
      "adminUserList"
    );


  const {
    data,
    error
  } =
    await supabaseClient.rpc(
      "get_admin_users"
    );


  if (error) {

    container.innerHTML =
      `<p class="muted">
        Unable to load users.
      </p>`;

    console.error(error);

    return;

  }


  if (!data || !data.length) {

    container.innerHTML =
      `<p class="muted">
        No users found.
      </p>`;

    return;

  }


  container.innerHTML =
    data.map(
      user => {

        const suspended =
          user.banned_until &&
          new Date(
            user.banned_until
          ) > new Date();


        const status =
          suspended
            ? "Suspended"
            : "Active";


        return `

          <div class="item">

            <strong>
              ${escapeHtml(
                user.email
              )}
            </strong>

            <p>
              Role:
              ${escapeHtml(
                user.role
              )}
            </p>

            <p>
              Status:
              <strong>
                ${status}
              </strong>
            </p>

            ${
              user.role !==
              "admin"
                ? `
                  <button
                    class="secondary-btn"
                    onclick="toggleUserStatus(
                      '${user.user_id}',
                      ${suspended}
                    )"
                  >
                    ${
                      suspended
                        ? "Activate"
                        : "Suspend"
                    }
                  </button>
                `
                : ""
            }

          </div>

        `;

      }
    ).join("");

}


/* =====================================================
   ADMIN SUSPEND / ACTIVATE
===================================================== */

async function toggleUserStatus(
  userId,
  currentlySuspended
) {

  const action =
    currentlySuspended
      ? "activate"
      : "suspend";


  if (
    !confirm(
      `Are you sure you want to ${action} this user?`
    )
  )
    return;


  const {
    error
  } =
    await supabaseClient.rpc(
      "admin_set_user_status",
      {
        target_user_id:
          userId,

        should_suspend:
          !currentlySuspended
      }
    );


  if (error) {

    alert(
      error.message
    );

    return;

  }


  await loadAdminUsers();

}


/* =====================================================
   SEARCH
===================================================== */

document
  .getElementById(
    "leadSearch"
  )
  .addEventListener(
    "input",
    renderLeads
  );


document
  .getElementById(
    "leadFilter"
  )
  .addEventListener(
    "change",
    renderLeads
  );


document
  .getElementById(
    "propertySearch"
  )
  .addEventListener(
    "input",
    renderProperties
  );


document
  .getElementById(
    "propertyFilter"
  )
  .addEventListener(
    "change",
    renderProperties
  );


/* =====================================================
   HELPERS
===================================================== */

function normalize(value) {

  return String(
    value || ""
  )
    .trim()
    .toLowerCase();

}


function formatMoney(value) {

  return (
    "UGX " +
    Number(
      value || 0
    ).toLocaleString(
      "en-UG"
    )
  );

}


function getToday() {

  const date =
    new Date();


  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  return `${year}-${month}-${day}`;

}


function escapeHtml(value) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


function escapeAttr(value) {

  return String(
    value ?? ""
  )
    .replace(
      /\\/g,
      "\\\\"
    )
    .replace(
      /'/g,
      "\\'"
    );

}


/* =====================================================
   INITIAL SESSION
===================================================== */

(async function init() {

  const {
    data,
    error
  } =
    await supabaseClient.auth.getSession();


  if (error) {

    console.error(error);

    showAuth();

    return;

  }

if (
  window.location.hash.includes("type=recovery") &&
  data.session
) {
  showPasswordResetForm();
  return;
}

  if (data.session) {

    currentUser =
      data.session.user;

    await startApplication();

  } else {

    showAuth();

  }

})();
