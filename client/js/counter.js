const counters = document.querySelectorAll(".counter");

counters.forEach(function(counter){

    const target = Number(counter.dataset.target);

    let count = 0;

    const increment = target / 100;

    function updateCounter(){

        if(count < target){

            count += increment;

            counter.textContent = Math.ceil(count);

            setTimeout(updateCounter,20);

        }

        else{

            counter.textContent = target;

        }

    }

    updateCounter();

});