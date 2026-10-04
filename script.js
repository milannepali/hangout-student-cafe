const restaurantList = document.querySelector("#restaurant-list");
const menu = document.querySelector("#menu");
const cityFilter = document.querySelector("#city-filter");

let allRestaurants = [];

async function getRestaurants() {
  try {
    const response = await fetch(
      "https://media2.edu.metropolia.fi/restaurant/api/v1/restaurants",
    );

    const restaurants = await response.json();

    allRestaurants = restaurants;

    showRestaurants(restaurants);
    addCities(restaurants);
  } catch (error) {
    console.log("Error:", error);
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

cityFilter.addEventListener("change", () => {
  const selectedCity = cityFilter.value;

  if (selectedCity === "all") {
    showRestaurants(allRestaurants);
  } else {
    const filteredRestaurants = allRestaurants.filter((restaurant) => {
      return restaurant.city === selectedCity;
    });

    showRestaurants(filteredRestaurants);
  }
});

function showRestaurants(restaurants) {
  restaurantList.innerHTML = "";

  restaurants.forEach((restaurant) => {
    const restaurantDiv = document.createElement("div");

    restaurantDiv.classList.add("restaurant-card");

    restaurantDiv.innerHTML = `
      <h3>${restaurant.name}</h3>
      <p>${restaurant.address}</p>
      <p>${restaurant.city || ""}</p>
    `;

    restaurantDiv.addEventListener("click", () => {
      selectRestaurant(restaurant);
    });

    restaurantList.appendChild(restaurantDiv);
  });
}

function selectRestaurant(restaurant) {
  menu.innerHTML = `
    <h3>${restaurant.name}</h3>
    <p>${restaurant.address}</p>
    <p>${restaurant.city || ""}</p>

    <button id="daily-button">Daily Menu</button>
    <button id="weekly-button">Weekly Menu</button>

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

async function getDailyMenu(id) {
  const menuContent = document.querySelector("#menu-content");

  try {
    const response = await fetch(
      `https://media2.edu.metropolia.fi/restaurant/api/v1/restaurants/daily/${id}/fi`,
    );

    const dailyMenu = await response.json();

    menuContent.innerHTML = "<h3>Today's Menu</h3>";

    if (!dailyMenu.courses || dailyMenu.courses.length === 0) {
      menuContent.innerHTML += "<p>No menu available for today.</p>";
      return;
    }

    dailyMenu.courses.forEach((course) => {
      menuContent.innerHTML += `
        <div>
          <p><strong>${course.name}</strong></p>
          <p>${course.price || ""}</p>
        </div>
      `;
    });
  } catch (error) {
    console.log("Error:", error);
  }
}

async function getWeeklyMenu(id) {
  const menuContent = document.querySelector("#menu-content");

  try {
    const response = await fetch(
      `https://media2.edu.metropolia.fi/restaurant/api/v1/restaurants/weekly/${id}/fi`,
    );

    const weeklyMenu = await response.json();

    menuContent.innerHTML = "<h3>Weekly Menu</h3>";

    if (!weeklyMenu.days || weeklyMenu.days.length === 0) {
      menuContent.innerHTML += "<p>No weekly menu available.</p>";
      return;
    }

    weeklyMenu.days.forEach((day) => {
      menuContent.innerHTML += `
        <h4>${day.date || ""}</h4>
      `;

      if (day.courses && day.courses.length > 0) {
        day.courses.forEach((course) => {
          menuContent.innerHTML += `
            <div>
              <p><strong>${course.name}</strong></p>
              <p>${course.price || ""}</p>
            </div>
          `;
        });
      } else {
        menuContent.innerHTML += "<p>No menu available.</p>";
      }
    });
  } catch (error) {
    console.log("Error:", error);
  }
}

getRestaurants();
