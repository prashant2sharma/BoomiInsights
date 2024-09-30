// homeScript.js

// Optionally, you can add event listeners for any additional behavior
document.querySelectorAll('.neumorphism-div').forEach(function(div) {
    div.addEventListener('mouseenter', function() {
        div.style.cursor = 'pointer';
    });
});

