//faq response when clicked
const categoryButtons = document.querySelectorAll('.faq-category');
const faqItems = document.querySelectorAll('.faq-item');

categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
    categoryButtons.forEach(b => b.classList.remove('active'));
    button.classList.add('active');

    const selected = button.dataset.category;
    faqItems.forEach(item => {
        item.style.display = (selected === 'all' || item.dataset.category === selected) ? 'block' : 'none';
    });
    });
});

const faqQuestions = document.querySelectorAll('.faq-question');

faqQuestions.forEach(q => {
  q.addEventListener('click', () => {
    const faqItem = q.parentElement;
    const answer = q.nextElementSibling;

    //toggle the open class
    faqItem.classList.toggle('open');

    // toggle answer visibility
    if (faqItem.classList.contains('open')) {
      answer.style.display = 'block';
    } else {
      answer.style.display = 'none';
    }
  });
});
