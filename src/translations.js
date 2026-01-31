export const TRANSLATIONS = {
    ua: {
        // --- Auth & General ---
        website_title: "U-Budget | Керуй грошима розумно",
        login: "Вхід",
        register: "Реєстрація",
        email_placeholder: "Ваш email",
        password_placeholder: "Ваш пароль",
        login_btn: "Увійти",
        create_account: "Створити акаунт",
        or_via: "Або через",
        manage_money: "Керуй грошима розумно",
        welcome_slogan: "Because it's about U",
        forgot_password: "Забули пароль?",
        reset_password: "Скинути пароль",
        send_reset: "Надіслати посилання",
        back_to_login: "Назад до входу",
        logout: "Вийти",
        
        // --- Tabs ---
        budget_tab: "Бюджет",
        assets: "Активи",
        credits_tab: "Кредити",
        
        // --- Dashboard ---
        total_balance: "Загальний баланс",
        expense: "Витрати",
        income: "Доходи",
        savings: "Заощадження",
        history: "Історія",
        no_trans: "Немає транзакцій",
        export: "Експорт",
        
        // --- Time Filters ---
        this_month: "Цей місяць",
        last_month: "Минулий місяць",
        this_year: "Цей рік",
        all_time: "Весь час",
        search: "Пошук...",
        
        // --- Assets ---
        total_net_worth: "Чистий капітал",
        add_asset: "Додати актив",
        edit_asset: "Редагувати актив",
        asset_name: "Назва активу",
        asset_type_cash: "Готівка",
        asset_type_crypto: "Крипто",
        asset_type_stock: "Акції/Фонди",
        holdings: "Кількість / Сума",
        current_rate: "Курс / Ціна за одиницю",
        total_value: "Загальна оцінка (в основній валюті)",
        select_coin: "Оберіть монету",
        asset_currency: "Валюта активу",
        exchange_rate: "Курс обміну",
        auto_rate_fetching: "Оновлення курсу...",
        
        // --- Credits ---
        total_credit_debt: "Загальний борг",
        active_loans: "Активні кредити",
        add_credit: "Додати кредит",
        edit_credit: "Редагувати кредит",
        credit_name: "Назва кредиту",
        total_debt: "Сума боргу",
        current_balance: "Залишок боргу",
        interest_rate: "Відсоткова ставка (%)",
        pay_now: "Сплатити",
        no_credits: "Активних кредитів немає. Ви вільні!",
        payment_amount: "Сума платежу",
        confirm_payment: "Підтвердити оплату",
        loan_history: "Історія кредитів (Закриті)",
        paid_off: "Виплачено!",
        progress: "Прогрес",
        min_payment: "Мін. платіж",
        due_date: "День оплати",
        due_date_placeholder: "1-31",
        
        // --- Settings & Categories ---
        settings: "Налаштування",
        profile_settings_title: "Налаштування профілю",
        name_placeholder: "Ваше ім'я",
        profile_hint: "Це ім'я буде видно іншим учасникам бюджету.",
        profile_updated: "Профіль оновлено!",
        language: "Мова",
        currency: "Валюта",
        appearance: "Зовнішній вигляд",
        light: "Світла",
        dark: "Темна",
        limits_title: "Ліміти витрат (місяць)",
        limit_placeholder: "Ліміт",
        add_limit_label: "➕ Додати ліміт для...",
        custom_income_title: "Власні категорії доходів",
        custom_expense_title: "Власні категорії витрат",
        requests: "Запити на приєднання",
        
        // --- Team Management ---
        team_title: "Учасники бюджету",
        team_empty: "Поки що тільки ви",
        owner_label: "Власник",
        you_label: "Ви",
        remove_user_btn: "Видалити",
        leave_budget_btn: "Вийти з бюджету",

        // --- Budget Connection ---
        budget_connection: "Підключення до Бюджету",
        current_id_label: "ID цього бюджету (Ваш):",
        switch_budget_label: "Перемикнутися на інший бюджет:",
        switch_placeholder: "Введіть ID бюджету...",
        switch_btn: "Перейти",
        copied: "Скопійовано!",
        
        // --- Confirm Modal ---
        confirm_title: "Ви впевнені?",
        confirm_remove_user_msg: "Цей користувач втратить доступ до бюджету. Його транзакції залишаться.",
        confirm_leave_budget_msg: "Ви більше не зможете бачити цей бюджет. Ваші транзакції залишаться.",
        btn_confirm: "Так, продовжити",
        btn_cancel: "Скасувати",
        
        // --- Transaction Form ---
        add_transaction: "Додати транзакцію",
        edit_transaction: "Редагувати",
        amount_currency: "Сума та Валюта",
        category: "Категорія",
        date: "Дата",
        description: "Опис",
        isRecurring: "Щомісячний платіж",
        isRecurring_label: "Щомісячний платіж",
        save_btn: "Зберегти",
        add_btn: "Створити",

        // --- Recurring ---
        recurring_title: "Шаблони регулярних платежів",
        recurring_empty: "Немає регулярних транзакцій. Позначте транзакцію як 'Щомісячний платіж' при створенні.",
        add_now: "Додати зараз",
        last_payment: "Останній платіж:",

        // --- Invite Modal ---
        invite_title: "Запросити партнера",
        join_title: "Приєднатися до бюджету",
        invite_desc: "Поділіться цим ID з партнером, щоб вести спільний бюджет.",
        click_copy: "Натисніть, щоб скопіювати",
        partner_id_label: "ID Партнера",
        partner_id_placeholder: "Введіть ID тут...",
        send_request: "Надіслати запит",
        
        // --- Errors / Validations ---
        budget_not_found: "Бюджет з таким ID не знайдено",
        cannot_join_self: "Ви не можете приєднатися до власного бюджету",
        pending_approval: "Очікування подствердження...",
        cancel_request: "Скасувати запит",
        access_lost: "Доступ до бюджету втрачено",
        exchange_rate_error: "Не вдалося отримати актуальний курс обміну. Використовується останній відомий курс або потрібен ручний ввід.",
        conversion_error: "Помилка конвертації валюти",
        invalid_amount: "Некоректна сума",

        // --- Footer & Legal ---
        privacy_title: "Політика конфіденційності",
        terms_title: "Умови використання",
        support_title: "Підтримка",
        copyright: "© 2025 U-Budget. Всі права захищено.",
        
        // --- TEXT CONTENT ---
        privacy_text: `1. Збір даних: Ми збираємо лише необхідні дані для роботи додатку: ваш email (для ідентифікації) та фінансові дані, які ви вносите.
        2. Зберігання: Ваші дані надійно зберігаються на серверах Google Firebase.
        3. Треті сторони: Ми не передаємо ваші дані третім особам.
        4. Видалення: Ви можете видалити свій акаунт у будь-який час, звернувшись до підтримки.`,

        terms_text: `1. Використання: Цей додаток призначений для особистого обліку фінансів.
        2. Відповідальність: Ми не несемо відповідальності за фінансові рішення, прийняті на основі даних з додатку.
        3. Безпека: Ви несете відповідальність за збереження свого пароля.`,

        support_text: `Якщо у вас є питання або пропозиції, напишіть нам:
        Email: romannovobranets@gmail.com
        Ми відповідаємо протягом 24 годин.`,
        
        // --- INSTALL GUIDE ---
        install_app: "Встановити додаток",
        install_ios: "iOS (iPhone):",
        install_ios_step1: "1. Натисніть кнопку 'Поділитися' (квадрат зі стрілкою) внизу браузера Safari.",
        install_ios_step2: "2. Прокрутіть вниз і виберіть 'Додати на початковий екран'.",
        install_android: "Android:",
        install_and_step1: "1. Натисніть меню (три крапки) у верхньому куті Chrome.",
        install_and_step2: "2. Виберіть 'Встановити додаток' або 'Додати на головний екран'.",

        // --- Categories (Names) ---
        food: "Продукти",
        cafe: "Кафе та Ресторани",
        housing: "Житло та Комун.",
        transport: "Транспорт",
        health: "Здоров'я",
        shopping: "Шопінг",
        entertainment: "Розваги",
        communication: "Зв'язок та Інтернет",
        travel: "Подорожі",
        salary: "Зарплата",
        freelance: "Фріланс",
        savings_cat: "Скарбничка",
        education: "Освіта",
        gifts: "Подарунки",
        services: "Сервіси та Послуги",
        investments: "Інвестиції",
        other: "Інше",
        utilities: "Комунальні",
        rent: "Оренда",
        
        // --- Category Creation ---
        add_category: "Нова категорія",
        cat_name: "Назва",
        cat_type: "Тип",
        cat_icon: "Іконка",
        cat_color: "Колір",
        create_btn: "Створити",
        
        // --- Alerts ---
        success_save: "Успішно збережено!",
        error_save: "Помилка збереження",
        deleted: "Видалено",
        payment_recorded: "Оплату зараховано!",
        
        // --- Password Requirements ---
        pass_rule_title: "Вимоги до пароля:",
        pass_len: "8+ символів",
        pass_upper: "Велика літера",
        pass_lower: "Маленька літера",
        pass_num: "Цифра",
        pass_spec: "Спецсимвол (!@#$)",

        // --- Email Verification ---
        verify_email_title: "Підтвердіть Email",
        verify_email_text_start: "Ми надіслали лист на",
        verify_email_text_end: "Будь ласка, перейдіть за посиланням у листі, щоб активувати акаунт.",
        i_verified_btn: "Я підтвердив!",
    },
    en: {
        // --- Auth & General ---
        website_title: "U-Budget | Manage money wisely",
        login: "Login",
        register: "Register",
        email_placeholder: "Your email",
        password_placeholder: "Your password",
        login_btn: "Login",
        create_account: "Create Account",
        or_via: "Or continue with",
        manage_money: "Master your money",
        welcome_slogan: "Because it's about U",
        forgot_password: "Forgot Password?",
        reset_password: "Reset Password",
        send_reset: "Send Reset Link",
        back_to_login: "Back to Login",
        logout: "Log Out",
        
        // --- Tabs ---
        budget_tab: "Budget",
        assets: "Assets",
        credits_tab: "Credits",
        
        // --- Dashboard ---
        total_balance: "Total Balance",
        expense: "Expense",
        income: "Income",
        savings: "Savings",
        history: "History",
        no_trans: "No transactions yet",
        export: "Export",
        
        // --- Time Filters ---
        this_month: "This Month",
        last_month: "Last Month",
        this_year: "This Year",
        all_time: "All Time",
        search: "Search...",
        
        // --- Assets ---
        total_net_worth: "Net Worth",
        add_asset: "Add Asset",
        edit_asset: "Edit Asset",
        asset_name: "Asset Name",
        asset_type_cash: "Cash",
        asset_type_crypto: "Crypto",
        asset_type_stock: "Stocks/Funds",
        holdings: "Holdings / Amount",
        current_rate: "Rate / Price per unit",
        total_value: "Total Value (Main Currency)",
        select_coin: "Select Coin",
        asset_currency: "Asset Currency",
        exchange_rate: "Exchange Rate",
        auto_rate_fetching: "Fetching rate...",
        
        // --- Credits ---
        total_credit_debt: "Total Debt",
        active_loans: "Active Loans",
        add_credit: "Add Credit",
        edit_credit: "Edit Credit",
        credit_name: "Credit Name",
        total_debt: "Original Debt Amount",
        current_balance: "Current Balance",
        interest_rate: "Interest Rate (%)",
        pay_now: "Pay Now",
        no_credits: "No active credits. You are free!",
        payment_amount: "Payment Amount",
        confirm_payment: "Confirm Payment",
        loan_history: "Loan History",
        paid_off: "Paid Off",
        progress: "Progress",
        min_payment: "Min. Payment",
        due_date: "Due Date (Day)",
        due_date_placeholder: "1-31",
        
        // --- Settings & Categories ---
        settings: "Settings",
        profile_settings_title: "Profile Settings",
        name_placeholder: "Your Name",
        profile_hint: "This name will be visible to other budget members.",
        profile_updated: "Profile updated!",
        language: "Language",
        currency: "Currency",
        appearance: "Appearance",
        light: "Light",
        dark: "Dark",
        limits_title: "Expense Limits (Monthly)",
        limit_placeholder: "Limit",
        add_limit_label: "➕ Add limit for...",
        custom_income_title: "Custom Income Categories",
        custom_expense_title: "Custom Expense Categories",
        requests: "Join Requests",

        // --- Team Management ---
        team_title: "Budget Members",
        team_empty: "Just you for now",
        owner_label: "Owner",
        you_label: "You",
        remove_user_btn: "Remove",
        leave_budget_btn: "Leave Budget",

        // --- Budget Connection ---
        budget_connection: "Budget Connection",
        current_id_label: "Current Budget ID (Yours):",
        switch_budget_label: "Switch to another budget:",
        switch_placeholder: "Enter Budget ID...",
        switch_btn: "Switch",
        copied: "Copied!",

        // --- Confirm Modal ---
        confirm_title: "Are you sure?",
        confirm_remove_user_msg: "This user will lose access to the budget. Their transactions will remain.",
        confirm_leave_budget_msg: "You will no longer have access to this budget. Your transactions will remain.",
        btn_confirm: "Yes, continue",
        btn_cancel: "Cancel",
        
        // --- Transaction Form ---
        add_transaction: "Add Transaction",
        edit_transaction: "Edit Transaction",
        amount_currency: "Amount & Currency",
        category: "Category",
        date: "Date",
        description: "Description",
        isRecurring: "Recurring Transaction",
        isRecurring_label: "Recurring Transaction",
        save_btn: "Save",
        add_btn: "Add",

        // --- Recurring ---
        recurring_title: "Recurring Payment Templates",
        recurring_empty: "No recurring transactions found. Mark a transaction as 'Recurring' when creating.",
        add_now: "Add Now",
        last_payment: "Last payment:",

        // --- Invite Modal ---
        invite_title: "Invite Partner",
        join_title: "Join Budget",
        invite_desc: "Share this ID with your partner so they can join your budget.",
        click_copy: "Click to copy",
        partner_id_label: "Partner ID",
        partner_id_placeholder: "Enter ID here...",
        send_request: "Send Request",
        
        // Errors / Validations
        budget_not_found: "Budget with this ID not found",
        cannot_join_self: "You cannot join your own budget",
        pending_approval: "Pending Approval...",
        cancel_request: "Cancel Request",
        access_lost: "Access to budget lost",
        exchange_rate_error: "Could not fetch current exchange rate. Using last known rate or manual input required.",
        conversion_error: "Currency conversion failed",
        invalid_amount: "Invalid amount",

        // --- Footer & Legal ---
        privacy_title: "Privacy Policy",
        terms_title: "Terms of Service",
        support_title: "Support",
        copyright: "© 2025 U-Budget. All rights reserved.",
        
        // --- TEXT CONTENT ---
        privacy_text: `1. Data Collection: We collect only necessary data for the app to function: your email (for login) and financial data you input.
        2. Storage: Your data is securely stored on Google Firebase servers.
        3. Third Parties: We do not sell or share your data.
        4. Deletion: You can request account deletion at any time by contacting support.`,

        terms_text: `1. Usage: This app is for personal finance tracking.
        2. Disclaimer: We are not responsible for financial decisions made based on this app's data.
        3. Security: You are responsible for keeping your login credentials secure.`,

        support_text: `Need help? Found a bug? Have a suggestion?
        Email: romannovobranets@gmail.com
        We reply within 24 hours.`,

        // --- INSTALL GUIDE ---
        install_app: "Install App",
        install_ios: "iOS (iPhone):",
        install_ios_step1: "1. Tap the 'Share' button (square with arrow) at the bottom of Safari.",
        install_ios_step2: "2. Scroll down and tap 'Add to Home Screen'.",
        install_android: "Android:",
        install_and_step1: "1. Tap the menu (three dots) in Chrome.",
        install_and_step2: "2. Tap 'Install App' or 'Add to Home Screen'.",
        
        // --- Categories (Names) ---
        food: "Food & Groceries",
        cafe: "Cafe & Restaurants",
        housing: "Housing & Utilities",
        transport: "Transport",
        health: "Health & Care",
        shopping: "Shopping",
        entertainment: "Entertainment",
        communication: "Phone & Internet",
        travel: "Travel",
        salary: "Salary",
        freelance: "Freelance",
        savings_cat: "Savings",
        education: "Education",
        gifts: "Gifts",
        services: "Services",
        investments: "Investments",
        other: "Other",
        utilities: "Utilities",
        rent: "Rent",
        
        // --- Category Creation ---
        add_category: "New Category",
        cat_name: "Name",
        cat_type: "Type",
        cat_icon: "Icon",
        cat_color: "Color",
        create_btn: "Create",
        
        // --- Alerts ---
        success_save: "Saved successfully!",
        error_save: "Error saving",
        deleted: "Deleted",
        payment_recorded: "Payment recorded!",
        
        // --- Password Requirements ---
        pass_rule_title: "Password must have:",
        pass_len: "8+ characters",
        pass_upper: "Uppercase",
        pass_lower: "Lowercase",
        pass_num: "Number",
        pass_spec: "Special char (!@#$)",

        // --- Email Verification ---
        verify_email_title: "Verify Email",
        verify_email_text_start: "We sent an email to",
        verify_email_text_end: "Please follow the link in the email to activate your account.",
        i_verified_btn: "I Verified!",
    }
};