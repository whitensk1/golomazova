/**
 * Contact form for static GitHub Pages:
 * tries mailto with message body; also offers VK.
 */
(() => {
  "use strict";
  const form = document.getElementById("contact-form");
  const status = document.getElementById("cf-status");
  if (!form) return;

  // Подставьте email позже — пока mailto откроет клиент с пустым To, если не задан
  const MAIL_TO = "";

  const show = (text, isError) => {
    if (!status) return;
    status.textContent = text;
    status.classList.add("is-on");
    status.classList.toggle("is-error", !!isError);
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = (form.elements.name.value || "").trim();
    const contact = (form.elements.contact.value || "").trim();
    const message = (form.elements.message.value || "").trim();

    if (!name || !contact || !message) {
      show("Заполните все поля.", true);
      return;
    }

    const subject = encodeURIComponent("Сообщение с сайта — " + name);
    const body = encodeURIComponent(
      "Имя: " + name + "\nКонтакт: " + contact + "\n\n" + message
    );

    if (MAIL_TO) {
      window.location.href = "mailto:" + MAIL_TO + "?subject=" + subject + "&body=" + body;
      show("Открываю почтовый клиент…");
    } else {
      // Без email — копируем текст и ведём в VK
      const plain =
        "Имя: " + name + "\nКонтакт: " + contact + "\n\n" + message;
      const copy = () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          return navigator.clipboard.writeText(plain);
        }
        return Promise.reject();
      };
      copy()
        .then(() => {
          show("Текст скопирован. Откройте VK и вставьте сообщение.");
          window.open("https://vk.ru/vic_project", "_blank", "noopener");
        })
        .catch(() => {
          show("Напишите в VK — форма пока без почтового ящика.");
          window.open("https://vk.ru/vic_project", "_blank", "noopener");
        });
    }
  });
})();
