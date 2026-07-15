const subscribeButton = document.querySelector(".newsletter-form button");

if (subscribeButton) {

    subscribeButton.addEventListener("click", function () {

        const email = document.querySelector(".newsletter-form input").value;

        if (email === "") {

            alert("Please enter your email.");

            return;

        }

        alert("🎉 Thank you for subscribing!");

        document.querySelector(".newsletter-form input").value = "";

    });

}
