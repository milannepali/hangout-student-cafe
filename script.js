const apiUrl = "https://media2.edu.metropolia.fi/restaurant/api/v1";

const restaurantList = document.querySelector("#restaurant-list");

const menu = document.querySelector("#menu");

const cityFilter = document.querySelector("#city-filter");

const nearestButton = document.querySelector("#nearest-button");

const nearestInfo = document.querySelector("#nearest-info");

const loginForm = document.querySelector("#login-form");

const registerForm = document.querySelector("#register-form");

const authForms = document.querySelector("#auth-forms");

const userInfo = document.querySelector("#user-info");

const userName = document.querySelector("#user-name");

const userEmail = document.querySelector("#user-email");

const logoutButton = document.querySelector("#logout-button");

const authMessage = document.querySelector("#auth-message");

const editProfileButton = document.querySelector("#edit-profile-button");

const editProfile = document.querySelector("#edit-profile");

const profileForm = document.querySelector("#profile-form");

const profileUsername = document.querySelector("#profile-username");

const profileEmail = document.querySelector("#profile-email");

const profilePassword = document.querySelector("#profile-password");

const cancelEditButton = document.querySelector("#cancel-edit-button");

const profileImage = document.querySelector("#profile-image");

const avatarInput = document.querySelector("#avatar-input");

const uploadAvatarButton = document.querySelector("#upload-avatar-button");

let allRestaurants = [];
let nearestRestaurantId = null;
let currentUser = null;

const map = L.map("map").setView([64.2, 26.0], 5);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

const markerGroup = L.layerGroup().addTo(map);

/* REGISTER */

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = document.querySelector("#register-username").value;

  const email = document.querySelector("#register-email").value;

  const password = document.querySelector("#register-password").value;

  try {
    const response = await fetch(`${apiUrl}/users`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        username,
        email,
        password,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      authMessage.textContent =
        result.message || result.error || "Registration failed.";

      return;
    }

    authMessage.textContent = "Registration successful. You can now log in.";

    registerForm.reset();
  } catch (error) {
    console.log("Registration error:", error);

    authMessage.textContent = "Something went wrong during registration.";
  }
});

/* LOGIN */

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = document.querySelector("#login-username").value;

  const password = document.querySelector("#login-password").value;

  try {
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        username,
        password,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      authMessage.textContent =
        result.message || result.error || "Login failed.";

      return;
    }

    localStorage.setItem("token", result.token);

    currentUser = result.data;

    showLoggedInUser();

    showCurrentRestaurants();

    authMessage.textContent = "Login successful.";

    loginForm.reset();
  } catch (error) {
    console.log("Login error:", error);

    authMessage.textContent = "Something went wrong during login.";
  }
});

/* CHECK LOGIN */

async function checkLogin() {
  const token = localStorage.getItem("token");

  if (!token) {
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/users/token`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      localStorage.removeItem("token");
      return;
    }

    const result = await response.json();

    currentUser = result.data || result;

    showLoggedInUser();

    if (allRestaurants.length > 0) {
      showCurrentRestaurants();
    }
  } catch (error) {
    console.log("Token error:", error);
  }
}

function showLoggedInUser() {
  if (!currentUser) {
    return;
  }

  authForms.classList.add("hidden");
  userInfo.classList.remove("hidden");

  userName.textContent = `Username: ${currentUser.username}`;

  userEmail.textContent = `Email: ${currentUser.email}`;

  showProfileImage();
}

/* PROFILE IMAGE */

function showProfileImage() {
  if (!currentUser || !currentUser.avatar) {
    profileImage.classList.add("hidden");
    profileImage.removeAttribute("src");
    return;
  }

  let avatarUrl = currentUser.avatar;

  if (!avatarUrl.startsWith("http")) {
    avatarUrl = `https://media2.edu.metropolia.fi/restaurant/uploads/${currentUser.avatar}`;
  }

  profileImage.src = avatarUrl;

  profileImage.classList.remove("hidden");
}

/* AVATAR UPLOAD */

uploadAvatarButton.addEventListener("click", async () => {
  const token = localStorage.getItem("token");

  const file = avatarInput.files[0];

  if (!token) {
    authMessage.textContent = "You must be logged in.";

    return;
  }

  if (!file) {
    authMessage.textContent = "Choose an image first.";

    return;
  }

  const formData = new FormData();

  formData.append("avatar", file);

  try {
    const response = await fetch(`${apiUrl}/users/avatar`, {
      method: "POST",

      headers: {
        Authorization: `Bearer ${token}`,
      },

      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      authMessage.textContent =
        result.message || result.error || "Profile picture upload failed.";

      return;
    }

    if (result.data) {
      currentUser = {
        ...currentUser,
        ...result.data,
      };
    }

    showProfileImage();

    avatarInput.value = "";

    authMessage.textContent = "Profile picture uploaded successfully.";
  } catch (error) {
    console.log("Avatar upload error:", error);

    authMessage.textContent =
      "Something went wrong while uploading the picture.";
  }
});

/* LOGOUT */

logoutButton.addEventListener("click", () => {
  localStorage.removeItem("token");

  currentUser = null;

  userInfo.classList.add("hidden");

  editProfile.classList.add("hidden");

  authForms.classList.remove("hidden");

  authMessage.textContent = "You are logged out.";

  showCurrentRestaurants();
});

/* OPEN PROFILE EDITOR */

editProfileButton.addEventListener("click", () => {
  if (!currentUser) {
    return;
  }

  profileUsername.value = currentUser.username;

  profileEmail.value = currentUser.email;

  profilePassword.value = "";

  editProfile.classList.remove("hidden");
});

/* CANCEL PROFILE EDIT */

cancelEditButton.addEventListener("click", () => {
  editProfile.classList.add("hidden");
});

/* UPDATE PROFILE */

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const token = localStorage.getItem("token");

  if (!token) {
    authMessage.textContent = "You must be logged in.";

    return;
  }

  const updatedUser = {};

  const newUsername = profileUsername.value.trim();

  const newEmail = profileEmail.value.trim();

  const newPassword = profilePassword.value.trim();

  if (newUsername) {
    updatedUser.username = newUsername;
  }

  if (newEmail) {
    updatedUser.email = newEmail;
  }

  if (newPassword) {
    updatedUser.password = newPassword;
  }

  try {
    const response = await fetch(`${apiUrl}/users`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",

        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(updatedUser),
    });

    const result = await response.json();

    if (!response.ok) {
      authMessage.textContent =
        result.message || result.error || "Profile update failed.";

      return;
    }

    currentUser = result.data || result;

    showLoggedInUser();

    editProfile.classList.add("hidden");

    profilePassword.value = "";

    authMessage.textContent = "Profile updated successfully.";
  } catch (error) {
    console.log("Profile update error:", error);

    authMessage.textContent =
      "Something went wrong while updating your profile.";
  }
});

/* RESTAURANTS */

async function getRestaurants() {
  try {
    const response = await fetch(`${apiUrl}/restaurants`);

    const restaurants = await response.json();

    allRestaurants = restaurants;

    showRestaurants(restaurants);

    addCities(restaurants);

    showRestaurantsOnMap(restaurants);
  } catch (error) {
    console.log("Restaurant error:", error);
  }
}

function addCities(restaurants) {
  const cities = [];

  restaurants.forEach((restaurant) => {
    if (restaurant.city && !cities.includes(restaurant.city)) {
      cities.push(restaurant.city);
    }
  });

  cities.sort();

  cities.forEach((city) => {
    const option = document.createElement("option");

    option.value = city;

    option.textContent = city;

    cityFilter.appendChild(option);
  });
}

/* CITY FILTER */

cityFilter.addEventListener("change", () => {
  showCurrentRestaurants();
});

function showCurrentRestaurants() {
  const selectedCity = cityFilter.value;

  if (selectedCity === "all") {
    showRestaurants(allRestaurants);

    showRestaurantsOnMap(allRestaurants);

    return;
  }

  const filteredRestaurants = allRestaurants.filter((restaurant) => {
    return restaurant.city === selectedCity;
  });

  showRestaurants(filteredRestaurants);

  showRestaurantsOnMap(filteredRestaurants);
}

/* SHOW RESTAURANTS */

function showRestaurants(restaurants) {
  restaurantList.innerHTML = "";

  restaurants.forEach((restaurant) => {
    const restaurantDiv = document.createElement("div");

    restaurantDiv.classList.add("restaurant-card");

    if (restaurant._id === nearestRestaurantId) {
      restaurantDiv.classList.add("nearest");
    }

    const favoriteId = currentUser ? currentUser.favouriteRestaurant : null;

    const isFavorite = favoriteId === restaurant._id;

    let nearestText = "";
    let favoriteText = "";
    let favoriteButton = "";

    if (restaurant._id === nearestRestaurantId) {
      nearestText = `
          <p class="nearest-label">
            Nearest restaurant
          </p>
        `;
    }

    if (isFavorite) {
      favoriteText = `
          <p>
            <strong>
              ★ Favorite restaurant
            </strong>
          </p>
        `;
    }

    if (currentUser) {
      favoriteButton = `
          <button
            class="favorite-button"
            data-id="${restaurant._id}"
          >
            ${isFavorite ? "Favorite" : "Set Favorite"}
          </button>
        `;
    }

    restaurantDiv.innerHTML = `
        <h3>
          ${restaurant.name}
        </h3>

        <p>
          ${restaurant.address}
        </p>

        <p>
          ${restaurant.city || ""}
        </p>

        ${nearestText}

        ${favoriteText}

        ${favoriteButton}
      `;

    restaurantDiv.addEventListener("click", () => {
      selectRestaurant(restaurant);

      focusRestaurantOnMap(restaurant);
    });

    if (currentUser) {
      const favoriteButtonElement =
        restaurantDiv.querySelector(".favorite-button");

      favoriteButtonElement.addEventListener("click", (event) => {
        event.stopPropagation();

        saveFavorite(restaurant._id);
      });
    }

    restaurantList.appendChild(restaurantDiv);
  });
}

/* SAVE FAVORITE */

async function saveFavorite(restaurantId) {
  const token = localStorage.getItem("token");

  if (!token) {
    authMessage.textContent = "You must be logged in to save a favorite.";

    return;
  }

  try {
    const response = await fetch(`${apiUrl}/users`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",

        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        favouriteRestaurant: restaurantId,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      authMessage.textContent =
        result.message || result.error || "Could not save favorite restaurant.";

      return;
    }

    currentUser = result.data || result;

    authMessage.textContent = "Favorite restaurant saved.";

    showCurrentRestaurants();
  } catch (error) {
    console.log("Favorite error:", error);

    authMessage.textContent =
      "Something went wrong while saving your favorite.";
  }
}

/* MAP */

function showRestaurantsOnMap(restaurants) {
  markerGroup.clearLayers();

  const coordinates = [];

  restaurants.forEach((restaurant) => {
    if (
      restaurant.location &&
      restaurant.location.coordinates &&
      restaurant.location.coordinates.length === 2
    ) {
      const longitude = restaurant.location.coordinates[0];

      const latitude = restaurant.location.coordinates[1];

      const marker = L.marker([latitude, longitude]);

      marker.bindPopup(`
          <strong>
            ${restaurant.name}
          </strong>
          <br>
          ${restaurant.address}
          <br>
          ${restaurant.city || ""}
        `);

      marker.on("click", () => {
        selectRestaurant(restaurant);
      });

      markerGroup.addLayer(marker);

      coordinates.push([latitude, longitude]);
    }
  });

  if (coordinates.length > 0) {
    map.fitBounds(coordinates, {
      padding: [30, 30],
    });
  }
}

function focusRestaurantOnMap(restaurant) {
  if (!restaurant.location || !restaurant.location.coordinates) {
    return;
  }

  const longitude = restaurant.location.coordinates[0];

  const latitude = restaurant.location.coordinates[1];

  map.setView([latitude, longitude], 15);
}

/* NEAREST RESTAURANT */

nearestButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    nearestInfo.textContent = "Location is not supported by your browser.";

    return;
  }

  nearestInfo.textContent = "Finding your location...";

  navigator.geolocation.getCurrentPosition(
    findNearestRestaurant,
    locationError,
  );
});

function findNearestRestaurant(position) {
  const userLatitude = position.coords.latitude;

  const userLongitude = position.coords.longitude;

  let nearestRestaurant = null;

  let shortestDistance = Infinity;

  allRestaurants.forEach((restaurant) => {
    if (
      restaurant.location &&
      restaurant.location.coordinates &&
      restaurant.location.coordinates.length === 2
    ) {
      const restaurantLongitude = restaurant.location.coordinates[0];

      const restaurantLatitude = restaurant.location.coordinates[1];

      const distance = calculateDistance(
        userLatitude,
        userLongitude,
        restaurantLatitude,
        restaurantLongitude,
      );

      if (distance < shortestDistance) {
        shortestDistance = distance;

        nearestRestaurant = restaurant;
      }
    }
  });

  if (!nearestRestaurant) {
    nearestInfo.textContent = "Could not find a nearby restaurant.";

    return;
  }

  nearestRestaurantId = nearestRestaurant._id;

  cityFilter.value = "all";

  showRestaurants(allRestaurants);

  showRestaurantsOnMap(allRestaurants);

  nearestInfo.textContent =
    `Nearest restaurant: ${nearestRestaurant.name} ` +
    `(${shortestDistance.toFixed(2)} km away)`;

  const longitude = nearestRestaurant.location.coordinates[0];

  const latitude = nearestRestaurant.location.coordinates[1];

  L.marker([userLatitude, userLongitude])
    .addTo(markerGroup)
    .bindPopup("Your location")
    .openPopup();

  map.setView([latitude, longitude], 14);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371;

  const latitudeDifference = degreesToRadians(lat2 - lat1);

  const longitudeDifference = degreesToRadians(lon2 - lon1);

  const firstLatitude = degreesToRadians(lat1);

  const secondLatitude = degreesToRadians(lat2);

  const a =
    Math.sin(latitudeDifference / 2) * Math.sin(latitudeDifference / 2) +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDifference / 2) *
      Math.sin(longitudeDifference / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function locationError() {
  nearestInfo.textContent = "Location permission was not given.";
}

/* SELECT RESTAURANT */

function selectRestaurant(restaurant) {
  menu.innerHTML = `
    <h3>
      ${restaurant.name}
    </h3>

    <p>
      ${restaurant.address}
    </p>

    <p>
      ${restaurant.city || ""}
    </p>

    <button id="daily-button">
      Daily Menu
    </button>

    <button id="weekly-button">
      Weekly Menu
    </button>

    <div id="menu-content"></div>
  `;

  const dailyButton = document.querySelector("#daily-button");

  const weeklyButton = document.querySelector("#weekly-button");

  dailyButton.addEventListener("click", () => {
    getDailyMenu(restaurant._id);
  });

  weeklyButton.addEventListener("click", () => {
    getWeeklyMenu(restaurant._id);
  });

  menu.scrollIntoView({
    behavior: "smooth",
  });
}

/* DAILY MENU */

async function getDailyMenu(id) {
  const menuContent = document.querySelector("#menu-content");

  try {
    const response = await fetch(`${apiUrl}/restaurants/daily/${id}/fi`);

    const dailyMenu = await response.json();

    menuContent.innerHTML = "<h3>Today's Menu</h3>";

    if (!dailyMenu.courses || dailyMenu.courses.length === 0) {
      menuContent.innerHTML += "<p>No menu available for today.</p>";

      return;
    }

    dailyMenu.courses.forEach((course) => {
      menuContent.innerHTML += `
          <div>
            <p>
              <strong>
                ${course.name}
              </strong>
            </p>

            <p>
              ${course.price || ""}
            </p>
          </div>
        `;
    });
  } catch (error) {
    console.log("Daily menu error:", error);
  }
}

/* WEEKLY MENU */

async function getWeeklyMenu(id) {
  const menuContent = document.querySelector("#menu-content");

  try {
    const response = await fetch(`${apiUrl}/restaurants/weekly/${id}/fi`);

    const weeklyMenu = await response.json();

    menuContent.innerHTML = "<h3>Weekly Menu</h3>";

    if (!weeklyMenu.days || weeklyMenu.days.length === 0) {
      menuContent.innerHTML += "<p>No weekly menu available.</p>";

      return;
    }

    weeklyMenu.days.forEach((day) => {
      menuContent.innerHTML += `
          <h4>
            ${day.date || ""}
          </h4>
        `;

      if (day.courses && day.courses.length > 0) {
        day.courses.forEach((course) => {
          menuContent.innerHTML += `
                <div>
                  <p>
                    <strong>
                      ${course.name}
                    </strong>
                  </p>

                  <p>
                    ${course.price || ""}
                  </p>
                </div>
              `;
        });
      } else {
        menuContent.innerHTML += "<p>No menu available.</p>";
      }
    });
  } catch (error) {
    console.log("Weekly menu error:", error);
  }
}

/* START */

checkLogin();
getRestaurants();
