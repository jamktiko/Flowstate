<!-- Recommended to be opened in Visual Studio Code -->

# KeHu Document

**How is Sustainable Development taken into account in this project**

<!-- Vastaa osaan tai kaikkiin kysymyksiin saamiesi ohjeiden mukaan. -->

<!-- Täydennä ja muokkaa tarvittaessa sekä kysymyksiä että linkkilistaa. -->

<!-- Selkeyden vuoksi kysymyksissä puhutaan vain sovelluksesta, mutta tätä dokumenttia voi käyttää sovellusprojektin lisäksi monenlaisissa kurssitehtävissä sekä opinnäytetyössä. -->

<!-- Kestävä kehitys rakentuu hierarkkisesti. Sen perustana toimii ekologinen kestävyys, jonka toteutuessa on mahdollista rakentaa myös sosiaalista hyvinvointia. Ne kumpikin yhdessä mahdollistavat kestävän liiketoiminnan. -->

<!-- Jotta kestävän kehityksen tavoitteiden ja ohjelmistokehityksen välinen suhde olisi ymmärrettävämpi, jokaisessa kysymyksessä viitataan yhteen Agenda2030:n tavoitteeseen. Sama kysymys voi kuitenkin liittyä useaan eri tavoitteeseen etenkin eri näkökulmia painottamalla. -->

<!-- Kestävyyttä tulisi tarkastella välittömien vaikutusten lisäksi myös pidemmällä aikavälillä sekä siitä näkökulmasta, että sovelluksesta tulisikin todella suosittu. -->

<!-- Sovelluksen ei tarvitse eikä se voikaan olla kestävyydessään täydellinen. Tärkeintä on oppia tunnistamaan ja ymmärtämään kokonaisvaltaisesti, minkälaisia ekologisia ja sosiaalisia vaikutuksia sovelluksella voi olla sen koko elinkaaren ajan. -->

> ##### The Principles of Sustainable Development
>
> - [Sustainable Development Goals by UN](https://sdgs.un.org/goals)
> - [The SDGs Wedding Cake](https://www.stockholmresilience.org/research/research-news/2016-06-14-the-sdgs-wedding-cake.html)
> - [The Karlskrona Manifesto for Sustainability Design](https://sustainabilitydesign.org/karlskrona-manifesto/)
>
> ##### Designing Sustainability
>
> - [Sustainable Awereness Framework](https://www.suso.academy/en/sustainability-awareness-framework-susaf/)
> - [Sustainable Business Model Canvas](https://www.case-ka.eu/index.html%3Fp=2174.html)
> - [Flourishing Business Canvas](https://flourishingbusiness.org/download-flourishing-business-canvas/)
>
> ##### Methods for Sustainability
>
> - [MitViDi portal: criteria for ecologically sustainable software (in Finnish)](https://mitvidi.tt.utu.fi/mitvidityokalu)
> - [Self-assessment questionnaire for software development in Green ICT website (in Finnish)](https://greenict.fi/tyokalut/itsearviointi/itsearviointi-ohjelmistotuotanto/)
> - [Easy guide to accessibility (in Finnish)](https://saavutettavuusvaatimukset.fi/fi/yleista-saavutettavuudesta/ohjeita-suunnittelun-tueksi)
> - [Requirements for handling personal data (in Finnish)](https://tietosuoja.fi/henkilotietojen-kasittely)
>
> ##### Practical Instructions
>
> - [Markdow Guide](https://www.markdownguide.org/basic-syntax/)
> - Coden extensions enable reviewing Markdown (eg. Markdown Preview Enhanced) or exporting as PDF (eg. Markdown PDF)

## Motivation

### 1. Why is sustainable development important to me or our team?

Sustainable development matters to me and our team because we want to build software that creates long-term value without harming people or the planet, while making responsible choices about energy use, accessibility, and data practices from the start. We want to decrease the amount of mental health issues people face daily, by helping in time management.

## Subject

### 2. Why is this software necessary? Does it promote a Sustainable Development Goal?

This software is necessary because it helps users organize tasks, manage time, and keep track of deadlines in one place. It promotes better productivity and more efficient work, which supports SDG 8: Decent Work and Economic Growth.

## Implementation

### 3. How is energy consumption minimized?

**SDG12: Responsible Consumption and Production**

<!-- FOR EXAMPLE -->
<!-- How essential are the features and contents of the software? -->
<!-- Does the software harbour only data that is necessary? -->
<!-- How is the server capacity required by the software taken into account? -->
<!-- How does the software or its development utilise artifical intelligence? -->

The software minimizes energy consumption by using a lightweight interface that loads quickly and uses less CPU. It loads only the data the user currently needs instead of everything at once, which reduces unnecessary processing. The app also avoids excessive refreshes, animations, and live updates so it does not waste resources in the background. In addition, only essential data is stored, and heavy attachments or duplicate records are avoided. Dark mode is also supported, which can reduce screen power use on some devices and make the app more comfortable to use for longer periods.

### 4. In which ways might the software indirectly increase or decrease the consumption of natural resources?

**SDG12: Responsible Consumption and Production**

<!-- FOR EXAMPLE -->
<!-- Does the usage of the software require the purchase of new devices or accessories? -->
<!-- Does the software promote further consumption? (Eg. the software is a web shop) -->
<!-- In which ways could the software affect the habits of its users? (eg. increasing or decreasing use of cars) -->

The software can indirectly reduce the consumption of natural resources by helping users plan tasks and schedules more efficiently. This can reduce wasted time, unnecessary travel, and the need for paper calendars or printed notes. At the same time, we try to keep the app lightweight and avoid extra background activity so it does not use more resources than needed.

### 5. How is the longevity of the software ensured?

**SDG12: Responsible Consumption and Production**

<!-- FOR EXAMPLE -->
<!-- How dependant is the software on external systems and libraries? -->
<!-- Is the software adjustable to changing needs and requirements? -->
<!-- Is the source code and the development process of the software documented? -->

The longevity of the software is ensured by using a modern and widely supported technology stack, such as AWS and the MEAN stack. This makes the system easier to maintain, update, and scale as user needs change. The code can be documented and developed in a modular way, which helps future development and reduces dependence on specific features or people.

### 6. How does the softaware take into account accessibility and equity?

**SDG10: Reducing Inequalities**

<!-- FOR EXAMPLE -->
<!-- Does the software make assumptions about the user? (eg. age, gender, ethnicity) -->
<!-- Does the software meet legally mandated accessibility requirements? -->
<!-- What kinds of skills and wealth does the software require from its user? -->
<!-- In which languages is the software available? -->

The software takes accessibility and equity into account by keeping the interface simple, clear, and easy to use on different devices. It can support features like readable contrast, dark mode, and a responsive layout so more people can use it comfortably. The app is designed to be usable without advanced technical skills, which makes it more inclusive and fair for different users.

### 7. How could the software affect its user or people close to them?

**SDG3: Good Health and Wellbeing**

<!-- FOR EXAMPLE -->
<!-- What kinds of actions does the using of the software substitute, increase, decrease or enable? -->
<!-- How could the software affect social relations, health or mental conditions? -->
<!-- What kinds of effects could the software have on life management or financial circumstances? -->

The software can positively affect its users by helping them manage their time, reduce stress, and keep track of responsibilities more easily. This may also benefit people close to them, because better planning can improve communication, reduce missed appointments, and make daily life smoother. At the same time, if the app is used too much or sends too many notifications, it could become distracting, so we try to keep it balanced and helpful.

### 8. What kind of effects could the software have on a societal level?

**SDG16: Peace, Justice and Strong Institutions**

<!-- FOR EXAMPLE -->
<!-- Could the software and its users disturb others? -->
<!-- Could the software have wide effects in the society? (eg. labour and housing market, political atmosphere) -->
<!-- Is it possible to use the software for criminal purposes? -->
<!-- How is the software moderated? (eg. preventing disinformation and hate speech) -->
<!-- How are data security and data protection considered in the software?  -->

The software could have a positive effect on society by helping people manage their time better, which may improve productivity and reduce stress in school, work, and everyday life. It can also support more organized communication and planning, which may benefit groups and teams. Because it handles personal schedules and data, it is important to protect user privacy and keep the system secure so it cannot be misused.

### 9. How are human and material resources taken into account in the software project?

**SDG8: Decent Work and Economic Growth**

<!-- FOR EXAMPLE -->
<!-- Are the goals clear and realistic? -->
<!-- How is the well-being of the development team considered?  -->
<!-- Are agile methods (like Scrum) used in the project? -->
<!-- Is it possible to fairly compensate both the employees and the contractors? -->
<!-- Does the funding of the project provide for secure maintenance and long-term development of the software? -->

The project takes human and material resources into account by keeping the scope realistic and dividing the work so the team can work efficiently without unnecessary stress. Good communication, planning, and clear responsibilities help support the well-being of the development team. In addition, using a cloud-based solution and efficient development practices helps reduce the need for extra hardware and makes long-term maintenance easier.
