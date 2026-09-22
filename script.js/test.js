document.addEventListener("DOMContentLoaded", () => {
  const menuButtons = document.querySelectorAll('.menu-btn');
  const pageSections = document.querySelectorAll('.page-section');

  menuButtons.forEach(button => {
    button.addEventListener('click', () => {
      // 1. Deactivate old highlighted menu tabs
      menuButtons.forEach(btn => btn.classList.remove('active'));
      // 2. Highlight clicked menu tab
      button.classList.add('active');

      // 3. Smoothly sweep away old page content
      pageSections.forEach(section => {
        section.classList.remove('active');
      });
      
      // 4. Match dataset target attribute to target page section id
      const targetId = button.getAttribute('data-target');
      const targetSection = document.getElementById(targetId);
      
      if (targetSection) {
        targetSection.classList.add('active');
      }
    });
  });
});