// Initialize form elements
const form = document.getElementById("contact-inside");
const charCount = document.getElementById("char-count");
const messageInput = document.getElementById("message");
const formStatus = document.getElementById("form-status");
const submitBtn = document.getElementById("submit-btn");

// Character counter for message
messageInput.addEventListener("input", function() {
    const count = this.value.length;
    charCount.textContent = count;
});

// Form submission handler
form.addEventListener("submit", function (e) {
    e.preventDefault();
    console.log("Form submitted");

    // Basic input sanitization
    const name = DOMPurify.sanitize(document.getElementById("name").value.trim());
    const email = DOMPurify.sanitize(document.getElementById("email").value.trim());
    const message = DOMPurify.sanitize(document.getElementById("message").value.trim());

    console.log("Values:", { name, email, message });

    // Validate inputs
    if (!name || !email || !message) {
        showStatus("Please fill out all fields.", "error");
        return;
    }

    // Verify reCAPTCHA
    const recaptchaResponse = grecaptcha.getResponse();
    if (!recaptchaResponse) {
        showStatus("Please complete the reCAPTCHA.", "error");
        return;
    }

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner"></span> Sending...';
    showStatus("Sending message...", "info");

    // Send email using EmailJS
    emailjs
        .sendForm(
            "service_ozr3drw",    // Your SMTP Service ID
            "template_7fzxo7i",   // Your Template ID
            this,
            "QE9KkYr17w2oPxDjo"  // Your Public Key
        )
        .then(
            (response) => {
                console.log("SUCCESS!", response.status, response.text);
                showStatus("Message sent successfully! I'll get back to you soon.", "success");
                form.reset();
                grecaptcha.reset();
                charCount.textContent = "0";
            },
            (error) => {
                console.error("FAILED...", error);
                showStatus("Failed to send message. Please try again later.", "error");
            }
        )
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = "Send Message";
        });
});

// Helper function to show status messages
function showStatus(message, type) {
    formStatus.textContent = message;
    formStatus.className = `status-message ${type}`;
    
    // Auto-hide success and info messages after 5 seconds
    if (type === "success" || type === "info") {
        setTimeout(() => {
            formStatus.textContent = "";
            formStatus.className = "";
        }, 5000);
    }
}