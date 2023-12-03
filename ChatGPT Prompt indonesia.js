// ==UserScript==
// @name         💘ChatGPT Prompt indo seopedia.tech
// @namespace    https://greasyfork.org/
// @version      1.0.5
// @description  一Skrip untuk membantu pengguna dengan cepat memilih perintah ChatGPT "Prompt" di halaman web asli ChatGPT.。
// @author       OpenAI - ChatGPT
// @require      https://ajax.aspnetcdn.com/ajax/jQuery/jquery-3.6.4.min.js
// @match        https://chat.openai.com/
// @match        https://chat.openai.com/c/*
// @match        https://chat.openai.com/?*
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @license      GNU GPLv3
// @downloadURL https://seopedia.tech/user.js
// @updateURL https://seopedia.tech/meta.js
// ==/UserScript==

(function () {
    "use strict";
    const $ = window.jQuery;
    const DARK_MODE_STYLE = `
    .dark-mode-compatible {
      background-color: white;
      color: black;
    }
    .dark .dark-mode-compatible {
      background-color: #343540;
      color: white;
    }

    select {
      font-size: 16px;
      border-radius: 4px;
    }

    select option {
      font-size: 16px;
      padding: 8px;
    }

  `;

    //Pustaka prompt dapat dikustomisasi dengan mengganti tautan Json di bawah.
    const DATA_URL =
          "https://raw.githubusercontent.com/hantupota/iptv/main/input.json";

    const CATEGORY_DROPDOWN_ID = "chatgpt-prompt-selector-category";
    const SUBCATEGORY_DROPDOWN_ID = "chatgpt-prompt-selector-subcategory";
    const CUSTOM_PROMPT_DROPDOWN_ID = "customPromptDropdown";
    const CATEGORY_DROPDOWN_PLACEHOLDER = "[kategori]";
    const SUBCATEGORY_DROPDOWN_PLACEHOLDER = "[petunjuk]";
    const CUSTOM_PROMPT_DROPDOWN_PLACEHOLDER = "[Perintah khusus]";

    const CATEGORY_DROPDOWN_WIDTH = 100;
    const SUBCATEGORY_DROPDOWN_WIDTH = 180;
    const CUSTOM_PROMPT_DROPDOWN_WIDTH = 180;
    const DEFAULT_ENTRY_HEIGHT = 20;

    const CHECK_MARKUP_INTERVAL = 500;
    const ENTRY_HEIGHT_RESET_DELAY = 500;

    const CONTAINER_SELECTOR = "form div.md\\:w-full.justify-center";
    const ENTRY_SELECTOR = "textarea";

    const SELECT_START_TAG_TEMPLATE =
          '<select id="{{id}}" class="dark-mode-compatible" style="width: {{width}}px">';
    const SELECT_END_TAG_TEMPLATE = "</select>";
    const OPTION_TAG_TEMPLATE =
          '<option value="{{value}}" title="{{titleMark}}">{{title}}</option>';
    const DATA_LOAD_ERROR_MESSAGE =
          "ChatGPT meminta kesalahan pemilih: Tidak dapat mengunduh kumpulan data. Periksa apakah tautan json sudah benar.";

    const NEW_LINE = "\r\n";

    let promptItems = null;

    function placeholder(name) {
        return "{{" + name + "}}";
    }

    function createDropdown(parent, id, defaultOptionTitle, width, items) {
        let markup = SELECT_START_TAG_TEMPLATE.replace(
            placeholder("id"),
            id
        ).replace(placeholder("width"), width);

        markup += OPTION_TAG_TEMPLATE.replace(placeholder("value"), "")
            .replace(placeholder("title"), defaultOptionTitle)
            .replace(placeholder("titleMark"), "");

        for (const item of items) {
            const title = item.title;
            const mark = item.mark;
            markup += OPTION_TAG_TEMPLATE.replace(placeholder("value"), mark)
                .replace(placeholder("title"), title)
                .replace(placeholder("titleMark"), mark);
        }

        markup += SELECT_END_TAG_TEMPLATE;

        if (id === CATEGORY_DROPDOWN_ID) {
            parent.prepend(markup);
        } else {
            getCategoryDropdown().after(markup);
        }
    }

    function getCategoryDropdown() {
        return $("#" + CATEGORY_DROPDOWN_ID);
    }

    function getSubcategoryDropdown() {
        return $("#" + SUBCATEGORY_DROPDOWN_ID);
    }

    function getCustomPromptDropdown() {
        return $("#" + CUSTOM_PROMPT_DROPDOWN_ID);
    }

    function handleSubcategoryChange() {
        const categoryDropdown = getCategoryDropdown();
        const categoryMark = categoryDropdown.val();
        const categoryItem = promptItems.find((item) => item.mark === categoryMark);

        if (categoryItem === null) return;

        const subcategoryMark = $(this).val();
        const subcategoryItem = categoryItem.items.find(
            (item) => item.mark === subcategoryMark
        );

        if (subcategoryItem === null) return;

        const prompt = categoryItem.prompt.replace(
            placeholder("prompt"),
            subcategoryItem.prompt
        );
        const parts = prompt.split(NEW_LINE);
        const heightInPixels = DEFAULT_ENTRY_HEIGHT * parts.length + 1;

        const entry = $(ENTRY_SELECTOR);
        const button = entry.next();

        entry.height(heightInPixels);
        entry.val(prompt);

        button.prop("disabled", false);
        button.click(() => {
            setTimeout(() => {
                entry.height(DEFAULT_ENTRY_HEIGHT);
            }, ENTRY_HEIGHT_RESET_DELAY);
        });
        const defaultCategoryMark = categoryDropdown
        .find('option:contains("bawaan")')
        .val();
        categoryDropdown.val(defaultCategoryMark);
        categoryDropdown.trigger("change");
    }

    function handleCategoryChange() {
        const categoryMark = $(this).val();
        const categoryItem = promptItems.find((item) => item.mark === categoryMark);
        if (categoryItem === null) return;

        const dropdown = getSubcategoryDropdown();
        if (dropdown.length > 0) dropdown.remove();

        const container = getContainer();
        createDropdown(
            container,
            SUBCATEGORY_DROPDOWN_ID,
            SUBCATEGORY_DROPDOWN_PLACEHOLDER,
            SUBCATEGORY_DROPDOWN_WIDTH,
            categoryItem.items
        );

        const subcategoryDropdown = getSubcategoryDropdown();
        subcategoryDropdown.change(handleSubcategoryChange);
    }

    function handleCustomPromptChange() {
        const customPrompt = $(this).val();
        const entry = $(ENTRY_SELECTOR);
        const button = entry.next();

        entry.val(customPrompt);

        // Hitung tinggi tip khusus yang dipilih dan terapkan ke kotak masukan
        const parts = customPrompt.split(NEW_LINE);
        const heightInPixels = DEFAULT_ENTRY_HEIGHT * parts.length + 1;
        entry.height(heightInPixels);

        button.prop("disabled", false);
        button.click(() => {
            setTimeout(() => {
                entry.height(DEFAULT_ENTRY_HEIGHT);
            }, ENTRY_HEIGHT_RESET_DELAY);
        });
    }

    function activateCheckTimer() {
        setInterval(checkMarkup, CHECK_MARKUP_INTERVAL);
    }

    function getContainer() {
        return $(CONTAINER_SELECTOR);
    }

    function checkMarkup() {
        const container = getContainer();

        if (container.has("select").length > 0) return;
        if (window.innerWidth <= 480) return;

        createDropdown(
            container,
            CATEGORY_DROPDOWN_ID,
            CATEGORY_DROPDOWN_PLACEHOLDER,
            CATEGORY_DROPDOWN_WIDTH,
            promptItems
        );
        createDropdown(
            container,
            SUBCATEGORY_DROPDOWN_ID,
            SUBCATEGORY_DROPDOWN_PLACEHOLDER,
            SUBCATEGORY_DROPDOWN_WIDTH,
            []
        );
        const customPrompts = JSON.parse(GM_getValue("customPrompts", "[]"));
        createDropdown(
            container,
            CUSTOM_PROMPT_DROPDOWN_ID,
            CUSTOM_PROMPT_DROPDOWN_PLACEHOLDER,
            CUSTOM_PROMPT_DROPDOWN_WIDTH,
            customPrompts
        );
        const customPromptDropdown = getCustomPromptDropdown();
        customPromptDropdown.toggle(customPrompts.length > 0);
        customPromptDropdown.change(handleCustomPromptChange);

        const categoryDropdown = getCategoryDropdown();
        categoryDropdown.change(handleCategoryChange);
        const defaultCategoryMark = categoryDropdown
        .find('option:contains("bawaan")')
        .val();
        categoryDropdown.val(defaultCategoryMark);
        categoryDropdown.trigger("change");
        addCustomPromptButton();
    }

    function addCustomPrompt() {
        const title = prompt("Silakan masukkan judul untuk perintahnya:");
        if (!title) return;
        const customPrompts = JSON.parse(GM_getValue("customPrompts", "[]"));
        if (customPrompts.find((item) => item.title === title)) {
            alert("Judul sudah ada, silakan masukkan judul baru.");
            return;
        }

        const content = prompt("Silakan masukkan konten yang diminta:");
        if (!content) return;

        customPrompts.push({ title, mark: content });
        GM_setValue("customPrompts", JSON.stringify(customPrompts));

        const customPromptDropdown = getCustomPromptDropdown();
        customPromptDropdown.append(
            OPTION_TAG_TEMPLATE.replace(placeholder("value"), content)
            .replace(placeholder("title"), title)
            .replace(placeholder("titleMark"), content)
        );
        customPromptDropdown.val(content);
        customPromptDropdown.trigger("change");
        customPromptDropdown.show();
    }

    function removeCustomPrompt(mark) {
        let customPrompts = JSON.parse(GM_getValue("customPrompts", "[]"));
        customPrompts = customPrompts.filter((item) => item.mark !== mark);
        GM_setValue("customPrompts", JSON.stringify(customPrompts));
    }

    function addCustomPromptButton() {
        let addButton, removeButton;

        const container = getContainer();
        addButton = $(
            '<button class="dark-mode-compatible btn relative btn-neutral border-0 md:border" type="button">Tambahkan</button>'
        );
        addButton.click(addCustomPrompt);
        removeButton = $(
            '<button class="dark-mode-compatible btn relative btn-neutral border-0 md:border" type="button">Hapus</button>'
        );
        removeButton.click(() => {
            const customPromptDropdown = getCustomPromptDropdown();
            const mark = customPromptDropdown.val();
            if (!mark) return;
            customPromptDropdown.find(`option[value="${mark}"]`).remove();
            removeCustomPrompt(mark);
            if (customPromptDropdown.children().length <= 1) {
                customPromptDropdown.hide();
                removeButton.hide();
                addButton.show(); // Tampilkan tombol tambah
            }

            // Hapus kotak masukan
            const entry = $(ENTRY_SELECTOR);
            entry.val("");
        });
        removeButton.hide();
        getCustomPromptDropdown().after(removeButton);
        getCustomPromptDropdown().after(addButton);

        const customPromptDropdown = getCustomPromptDropdown();
        if (customPromptDropdown.children().length <= 1) {
            removeButton.hide();
            addButton.show(); // Tampilkan tombol tambah
        }

        customPromptDropdown.on("change", () => {
            if (customPromptDropdown.val()) {
                removeButton.show();
                addButton.hide(); // Sembunyikan tombol tambah
            } else {
                removeButton.hide();
                addButton.show(); // Tampilkan tombol tambah
            }
        });
    }




    function createCustomPromptDropdown() {
        const container = getContainer();
        const customPrompts = JSON.parse(GM_getValue("customPrompts", "[]"));
        const customPromptDropdown = $(
            `<select id="${CUSTOM_PROMPT_DROPDOWN_ID}" class="${CATEGORY_DROPDOWN_ID}" style="width: ${CATEGORY_DROPDOWN_WIDTH}px" size="${customPrompts.length}"></select>`
      );
        container.append(customPromptDropdown);

        for (const customPrompt of customPrompts) {
            customPromptDropdown.append(
                `<option value="${customPrompt.mark}" title="${customPrompt.mark}">${customPrompt.title}</option>`
        );
        }

        if (customPrompts.length === 0) {
            customPromptDropdown.hide();
        } else {
            customPromptDropdown.show();
        }

        customPromptDropdown.change(() => {
            const selectedPrompt = customPromptDropdown.val();
            if (selectedPrompt) {
                const entry = $(ENTRY_SELECTOR);
                entry.val(selectedPrompt);
            }
        });

        return customPromptDropdown;
    }

    function setReceivedData(jsonText) {
        promptItems = JSON.parse(jsonText);
    }

    function loadData() {
        const getData = new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: DATA_URL,
                responseType: "text",
                overrideMimeType: "text/html; charset=UTF-8",
                onload: (response) => {
                    resolve(response.responseText);
                },
                onerror: () => {
                    reject(DATA_LOAD_ERROR_MESSAGE);
                },
            });

        });

        getData
            .then((data) => {
            setReceivedData(data);
            activateCheckTimer();
        })
            .catch((error) => {
            console.error(error);
        });
    }

    function addDarkModeStyles() {
        const styleTag = document.createElement("style");
        styleTag.innerHTML = DARK_MODE_STYLE;
        document.head.appendChild(styleTag);
    }

    createCustomPromptDropdown();
    activateCheckTimer();
    addDarkModeStyles();
    loadData();
    addCustomPromptButton();
})();
