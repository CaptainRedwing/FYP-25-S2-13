//stripe payment for pro plan
document.addEventListener('DOMContentLoaded', () => {
  const getProBtn = document.getElementById('getProBtn');
  const proOptions = document.getElementById('proOptions');
  const userDropdown = document.getElementById('userDropdown');
  const userCountText = document.getElementById('userCount');
  const priceText = document.getElementById('price');
  const note = document.getElementById('note');
  const continueBtn = document.getElementById('subscribeBtn');

  const stripeLinks = {
    "1": "https://buy.stripe.com/test_cNi4gB3OLbBFdqc5Xrbsc00",
    "2": "https://buy.stripe.com/test_7sY7sN3OLbBFeug1Hbbsc01",
    "3": "https://buy.stripe.com/test_eVq00ldpl7lpeug71vbsc02",
    "4": "https://buy.stripe.com/test_dRmbJ3ad9fRV99WgC5bsc03",
    "5": "https://buy.stripe.com/test_fZu7sN5WTgVZeugdpTbsc04",
    "6": "https://buy.stripe.com/test_dRmbJ34SP0X1ae099Dbsc05",
    "7": "https://buy.stripe.com/test_fZu14p1GD8ptcm85Xrbsc06",
    "8": "https://buy.stripe.com/test_4gM4gB5WT9tx99W3Pjbsc07",
    "9": "https://buy.stripe.com/test_5kQ00l1GD9tx4TG1Hbbsc08",
    "10": "https://buy.stripe.com/test_9B6dRbetpcFJ71O99Dbsc09",
    "11": "https://buy.stripe.com/test_3cI7sNbhd2153PCadHbsc0a",
    "12": "https://buy.stripe.com/test_9B6dRb70XbBFdqc0D7bsc0b",
    "13": "https://buy.stripe.com/test_cNicN7fxt0X1bi4bhLbsc0c",
    "14": "https://buy.stripe.com/test_28E9AVfxt0X13PC2Lfbsc0d",
    "15": "https://buy.stripe.com/test_00w8wRad98ptcm83Pjbsc0e",
    "16": "https://buy.stripe.com/test_9B6fZj8513591Hu4Tnbsc0f",
    "17": "https://buy.stripe.com/test_28EfZjetpfRV3PC71vbsc0g",
    "18": "https://buy.stripe.com/test_4gM00letp6hl71O5Xrbsc0h",
    "19": "https://buy.stripe.com/test_cNicN73OLgVZ71O2Lfbsc0i",
    "20": "https://buy.stripe.com/test_eVq9AVad98ptdqcadHbsc0j"
  };

  function updatePricing(value) {
    const intVal = parseInt(value);
    if (intVal >= 1 && intVal <= 20) {
      let pricePerUser = intVal <= 5 ? 7.99 : intVal <= 10 ? 6.99 : 5.99;
      let total = (intVal * pricePerUser).toFixed(2);
      userCountText.textContent = `${intVal} user${intVal > 1 ? 's' : ''}`;
      priceText.textContent = `$${total}/month`;
      note.style.display = "none";
      continueBtn.style.display = "inline-block";
    } else {
      userCountText.textContent = "21+ users";
      priceText.textContent = "";
      note.style.display = "block";
      continueBtn.style.display = "none";
    }
  }

  if (getProBtn && proOptions && userDropdown) {
    getProBtn.addEventListener('click', () => {
      proOptions.classList.toggle('hidden');
    });

    userDropdown.addEventListener('change', () => {
      const selectedValue = userDropdown.value;
      updatePricing(selectedValue);
    });

    continueBtn.addEventListener('click', () => {
      const selectedValue = userDropdown.value;
      const url = stripeLinks[selectedValue];
      if (url) {
        window.location.href = url;
      }
    });

    // Initial load
    updatePricing(userDropdown.value);
  }
});

/*
//for key features in index.astro
document.querySelectorAll('.feature-card').forEach(card => 
    {card.addEventListener('click', () => {
        card.classList.toggle('expanded');
        });
    });
*/

// Donation buttons → Stripe links
document.querySelectorAll('.btn-donate[data-amount]').forEach(btn => {
  btn.addEventListener('click', () => {
    const amount = btn.getAttribute('data-amount');
    const stripeLinks = {
      "1": "https://donate.stripe.com/test_bJe00c7v3byE96LeYM2Nq06",
      "2": "https://donate.stripe.com/test_28EfZa02B7io0Af5oc2Nq07",
      "3": "https://donate.stripe.com/test_28EaEQ2aJ0U0ciX3g42Nq00",
      "5": "https://donate.stripe.com/test_3cI00c7v38msbeTg2Q2Nq01",
      "10": "https://donate.stripe.com/test_cNieV6g1z6ek0Af7wk2Nq02",
      "25": "https://donate.stripe.com/test_8x29AM2aJ8ms2In8Ao2Nq03",
      "50": "https://donate.stripe.com/test_8x2eV62aJ7io2In9Es2Nq04",
      "100": "https://donate.stripe.com/test_bJebIUbLjeKQ0AfdUI2Nq05"
    };
    const url = stripeLinks[amount];
    if (url) window.location.href = url;
  });
});

/*
// Custom donation
document.getElementById('customDonateBtn')?.addEventListener('click', () => {
  const amount = parseFloat(document.getElementById('customAmount').value);
  if (!amount || amount < 1) {
    alert("Please enter a valid amount above $1.");
    return;
  }

  // Optional: round to 2 decimals
  const roundedAmount = Math.round(amount * 100) / 100;

  // Redirect to Stripe link builder (see below)
  window.location.href = `https://yourdomain.com/create-custom-donation?amount=${roundedAmount}`;
});
*/

// Animate top donor flipping with random order
document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.flip-container');
  const donorCards = Array.from(container.querySelectorAll('.donor-card'));

  // Shuffle donor cards
  for (let i = donorCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    container.appendChild(donorCards[j]); // move shuffled card to container
  }

  let currentIndex = 0;
  const flipDonors = () => {
    donorCards.forEach(card => card.classList.remove('active', 'fade-out'));

    const current = donorCards[currentIndex];
    const prevIndex = currentIndex === 0 ? donorCards.length - 1 : currentIndex - 1;
    const previous = donorCards[prevIndex];

    previous.classList.add('fade-out');
    current.classList.add('active');

    currentIndex = (currentIndex + 1) % donorCards.length;
  };

  if (donorCards.length > 0) {
    donorCards[0].classList.add('active');
    setInterval(flipDonors, 3000);
  }
});

//Review Carousel
document.addEventListener("DOMContentLoaded", () => {
  const carousel = document.getElementById("reviewCarousel");
  const cards = carousel.querySelectorAll(".review-card");
  const scrollLeftBtn = document.getElementById("scrollLeft");
  const scrollRightBtn = document.getElementById("scrollRight");
  const cardWidth = cards[0].offsetWidth + 16;

  scrollLeftBtn.addEventListener("click", () => {
    if (carousel.scrollLeft <= 0) {
      // Go to end
      carousel.scrollTo({ left: carousel.scrollWidth, behavior: "smooth" });
    } else {
      carousel.scrollBy({ left: -cardWidth, behavior: "smooth" });
    }
  });

  scrollRightBtn.addEventListener("click", () => {
    if (carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 1) {
      // Go to beginning
      carousel.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      carousel.scrollBy({ left: cardWidth, behavior: "smooth" });
    }
  });
});

//Contact Us Page (submit button)
const contactForm = document.querySelector('.contact-form');
const popup = document.getElementById('popup');

if (contactForm && popup) {
  contactForm.addEventListener('submit', async (e) => {
    //e.preventDefault();

    const requiredFields = ['category', 'subject', 'name', 'email', 'message'];
    const allValid = requiredFields.every(id => {
      const input = document.getElementById(id);
      return input && input.value.trim() !== '';
    });

    if (!allValid) {
      alert('Please fill in all required fields before submitting.');
      return;
    }

    const formData = new FormData(contactForm);

    try {
      const response = await fetch(contactForm.action, {
        method: 'POST',
        headers: {
          Accept: 'application/json'
        },
        body: formData
      });

      if (response.ok) {
        popup.classList.remove('hidden');
        popup.classList.add('show');

        contactForm.reset();

        setTimeout(() => {
          popup.classList.remove('show');
          popup.classList.add('hidden');
        }, 3000);
      } else {
        alert('There was a problem submitting your form. Please try again.');
      }
    } catch (error) {
      alert('Error submitting form. Please check your internet connection and try again.');
    }
  });
}
