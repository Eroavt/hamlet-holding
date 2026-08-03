import type { LegalDoc } from './types';

/**
 * Datenschutzerklärung, transcribed verbatim from the client's
 * Datenschutz.docx. Wording is not edited — only the structure the .docx lost
 * is restored: headings that had been run into their body text, and sub-lists
 * that had been flattened into "- a- b- c" inside a single paragraph.
 */
export const PRIVACY_DE: LegalDoc = {
  title: 'Datenschutz',
  blocks: [
    {
      t: 'lead',
      text: 'Der Schutz personenbezogener Daten ist uns ein wichtiges Anliegen. Deshalb erfolgt die Verarbeitung personenbezogener Daten in Übereinstimmung mit den geltenden europäischen und nationalen Rechtsvorschriften.',
    },
    {
      t: 'note',
      text: 'Ihre Einwilligungserklärung(en) können Sie selbstverständlich jederzeit mit Wirkung für die Zukunft widerrufen. Bitte wenden Sie sich hierfür an den Verantwortlichen gem. § 1.',
    },
    {
      t: 'p',
      text: 'Die nachfolgende Erklärung gibt einen Überblick darüber, welche Art von Daten erhoben werden, in welcher Weise diese Daten genutzt und weitergegeben werden, welche Sicherheitsmaßnahmen wir zum Schutz Ihrer Daten ergreifen und auf welche Art und Weise Sie Auskunft über die uns gegebenen Informationen erhalten.',
    },

    { t: 'h2', text: 'Rechtsgrundlage für die Verarbeitung personenbezogener Daten' },
    {
      t: 'p',
      text: 'Soweit wir für Verarbeitungsvorgänge personenbezogener Daten eine Einwilligung der betroffenen Person einholen, dient Art. 6 Abs. 1 S. 1 lit. a) EU-Datenschutzgrundverordnung (DSGVO) als Rechtsgrundlage.',
    },
    {
      t: 'p',
      text: 'Bei der Verarbeitung von personenbezogenen Daten, die zur Erfüllung eines Vertrages, dessen Vertragspartei die betroffene Person ist, erforderlich ist, dient Art. 6 Abs. 1 S. lit. b) DSGVO als Rechtsgrundlage. Dies gilt auch für Verarbeitungsvorgänge, die zur Durchführung vorvertraglicher Maßnahmen erforderlich sind.',
    },
    {
      t: 'p',
      text: 'Soweit eine Verarbeitung personenbezogener Daten zur Erfüllung einer rechtlichen Verpflichtung erforderlich ist, der wir unterliegen, dient Art. 6 Abs. 1 S. 1 lit. c) DSGVO als Rechtsgrundlage.',
    },
    {
      t: 'p',
      text: 'Ist die Verarbeitung zur Wahrung eines berechtigten Interesses unseres Unternehmens oder eines Dritten erforderlich und überwiegen die Interessen, Grundrechte und Grundfreiheiten des Betroffenen das erstgenannte Interesse nicht, so dient Art. 6 Abs. 1 S. 1 lit. f) DSGVO als Rechtsgrundlage für die Verarbeitung.',
    },

    { t: 'h2', text: 'Datenlöschung und Speicherdauer' },
    {
      t: 'p',
      text: 'Die personenbezogenen Daten der betroffenen Person werden gelöscht oder gesperrt, sobald der Zweck der Speicherung entfällt. Eine Speicherung kann darüber hinaus erfolgen, wenn dies durch den europäischen oder nationalen Gesetzgeber in unionsrechtlichen Verordnungen, Gesetzen oder sonstigen Vorschriften, denen wir unterliegen, vorgesehen wurde. Eine Sperrung oder Löschung der Daten erfolgt auch dann, wenn eine durch die genannten Normen vorgeschriebene Speicherfrist abläuft, es sei denn, dass eine Erforderlichkeit zur weiteren Speicherung der Daten für einen Vertragsabschluss oder eine Vertragserfüllung besteht.',
    },

    { t: 'h2', text: '§ 1 Der Verantwortliche' },
    {
      t: 'p',
      text: 'Name und Anschrift des Verantwortlichen. Der Verantwortliche im Sinne der Datenschutz-Grundverordnung und anderer nationaler Datenschutzgesetze der Mitgliedsstaaten sowie sonstiger datenschutzrechtlicher Bestimmungen ist:',
    },
    {
      t: 'address',
      lines: [
        'Hamlet Holding GmbH',
        'Gewerbestr. 8',
        '87787 Wolfertschwenden',
        'Deutschland',
        'Telefon: +49 (0) 831 580 90 980',
        'E-Mail: info@seybandgruppe.de',
        'Geschäftsführer: Hamlet Avtandilyan',
      ],
    },

    { t: 'h2', text: '§ 2 Begriffsbestimmungen' },
    {
      t: 'p',
      text: 'Die Datenschutzerklärung beruht auf den Begrifflichkeiten, die durch den Europäischen Verordnungsgeber beim Erlass der EU-Datenschutz-Grundverordnung (nachfolgend: „DSGVO" genannt) verwendet wurden. Die Datenschutzerklärung soll einfach lesbar und verständlich sein. Um dies zu gewährleisten, werden nachfolgend die wichtigsten Begriffe erläutert:',
    },
    {
      t: 'ol',
      items: [
        {
          text: 'Personenbezogene Daten sind alle Informationen, die sich auf eine identifizierte oder identifizierbare natürliche Person (nachfolgend „betroffene Person" genannt) beziehen. Als identifizierbar wird eine natürliche Person angesehen, die direkt oder indirekt, insbesondere mittels Zuordnung zu einer Kennung wie einem Namen, zu einer Kennnummer, zu Standortdaten, zu einer Online-Kennung oder zu einem oder mehreren besonderen Merkmalen, die Ausdruck der physischen, physiologischen, genetischen, psychischen, wirtschaftlichen, kulturellen oder sozialen Identität dieser natürlichen Person sind, identifiziert werden kann.',
        },
        {
          text: 'Betroffene Person ist jede identifizierte oder identifizierbare natürliche Person, deren personenbezogene Daten von dem für die Verarbeitung Verantwortlichen verarbeitet werden.',
        },
        {
          text: 'Verarbeitung ist jeder mit oder ohne Hilfe automatisierter Verfahren ausgeführte Vorgang oder jede solche Vorgangsreihe im Zusammenhang mit personenbezogenen Daten wie das Erheben, das Erfassen, die Organisation, das Ordnen, die Speicherung, die Anpassung oder Veränderung, das Auslesen, das Abfragen, die Verwendung, die Offenlegung durch Übermittlung, Verbreitung oder eine andere Form der Bereitstellung, den Abgleich oder die Verknüpfung, die Einschränkung, das Löschen oder die Vernichtung.',
        },
        {
          text: 'Profiling ist jede Art der automatisierten Verarbeitung personenbezogener Daten, die darin besteht, dass diese personenbezogenen Daten verwendet werden, um bestimmte persönliche Aspekte, die sich auf eine natürliche Person beziehen, zu bewerten, insbesondere, um Aspekte bezüglich Arbeitsleistung, wirtschaftlicher Lage, Gesundheit, persönlicher Vorlieben, Interessen, Zuverlässigkeit, Verhalten, Aufenthaltsort oder Ortswechsel dieser natürlichen Person zu analysieren oder vorherzusagen.',
        },
        {
          text: 'Pseudonymisierung ist die Verarbeitung personenbezogener Daten in einer Weise, auf welche die personenbezogenen Daten ohne Hinzuziehung zusätzlicher Informationen nicht mehr einer spezifischen betroffenen Person zugeordnet werden können, sofern diese zusätzlichen Informationen gesondert aufbewahrt werden und technischen und organisatorischen Maßnahmen unterliegen, die gewährleisten, dass die personenbezogenen Daten nicht einer identifizierten oder identifizierbaren natürlichen Person zugewiesen werden.',
        },
        {
          text: 'Verantwortlicher oder für die Verarbeitung Verantwortlicher ist die natürliche oder juristische Person, Behörde, Einrichtung oder andere Stelle, die allein oder gemeinsam mit anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten entscheidet. Sind die Zwecke und Mittel dieser Verarbeitung durch das Unionsrecht oder das Recht der Mitgliedstaaten vorgegeben, so kann der Verantwortliche beziehungsweise können die bestimmten Kriterien seiner Benennung nach dem Unionsrecht oder dem Recht der Mitgliedstaaten vorgesehen werden.',
        },
        {
          text: 'Auftragsverarbeiter ist eine natürliche oder juristische Person, Behörde, Einrichtung oder andere Stelle, die personenbezogene Daten im Auftrag des Verantwortlichen verarbeitet.',
        },
        {
          text: 'Empfänger ist eine natürliche oder juristische Person, Behörde, Einrichtung oder andere Stelle, der personenbezogene Daten offengelegt werden, unabhängig davon, ob es sich bei ihr um einen Dritten handelt oder nicht. Behörden, die im Rahmen eines bestimmten Untersuchungsauftrags nach dem Unionsrecht oder dem Recht der Mitgliedstaaten möglicherweise personenbezogene Daten erhalten, gelten jedoch nicht als Empfänger.',
        },
        {
          text: 'Dritter ist eine natürliche oder juristische Person, Behörde, Einrichtung oder andere Stelle außer der betroffenen Person, dem Verantwortlichen, dem Auftragsverarbeiter und den Personen, die unter der unmittelbaren Verantwortung des Verantwortlichen oder des Auftragsverarbeiters befugt sind, die personenbezogenen Daten zu verarbeiten.',
        },
        {
          text: 'Einwilligung ist jede von der betroffenen Person freiwillig für den bestimmten Fall in informierter Weise und unmissverständlich abgegebene Willensbekundung in Form einer Erklärung oder einer sonstigen eindeutigen bestätigenden Handlung, mit der die betroffene Person zu verstehen gibt, dass sie mit der Verarbeitung der sie betreffenden personenbezogenen Daten einverstanden ist.',
        },
      ],
    },

    { t: 'h2', text: '§ 3 Bereitstellung der Website und Erstellung von Logfiles' },
    {
      t: 'ol',
      items: [
        {
          text: 'Bei der bloß informatorischen Nutzung der Website, also wenn Sie sich nicht registrieren oder uns anderweitig Informationen übermitteln, erheben wir bei jedem Aufruf der Website automatisiert folgende Daten und Informationen vom Computersystem des aufrufenden Rechners:',
          sub: [
            'Die IP-Adresse des Nutzers',
            'Informationen über den Browsertyp und die verwendete Version',
            'Das Betriebssystem des Nutzers',
            'Den Internet-Service-Provider des Nutzers',
            'Datum und Uhrzeit des Zugriffs',
            'Websites, von denen das System des Nutzers auf die Internetseite gelangt',
            'Websites, die vom System des Nutzers über unsere Internetseite aufgerufen werden',
            'Inhalt der Aufrufe (konkrete Seiten)',
            'Jeweils übertragene Datenmenge',
            'Sprache und Version der Browsersoftware',
            'Verwendete Suchmaschinen',
            'Namen heruntergeladener Dateien',
          ],
        },
        {
          text: 'Die Daten werden ebenfalls in den Logfiles unseres Systems gespeichert. Eine Speicherung dieser Daten zusammen mit anderen personenbezogenen Daten des Nutzers findet nicht statt.',
        },
        {
          text: 'Rechtsgrundlage für die vorübergehende Speicherung der Logfiles ist Art. 6 Abs. 1 S. lit. f) DSGVO.',
        },
        {
          text: 'Die vorübergehende Speicherung der IP-Adresse durch das System ist notwendig, um',
          sub: [
            'die Auslieferung der Website an den Rechner des Nutzers zu ermöglichen. Hierfür muss die IP-Adresse des Nutzers für die Dauer der Sitzung gespeichert bleiben.',
            'die Inhalte unserer Webseite sowie die Werbung für diese zu optimieren',
            'die Funktionsfähigkeit unserer informationstechnologischen Systeme und der Technik unserer Webseite zu gewährleisten',
            'Strafverfolgungsbehörden im Falle eines Cyberangriffes die zur Strafverfolgung notwendigen Informationen bereitzustellen',
          ],
        },
        {
          text: 'Die Speicherung in Logfiles erfolgt, um die Funktionsfähigkeit der Website sicherzustellen. Zudem dienen uns die Daten zur Optimierung der Website und zur Sicherstellung der Sicherheit unserer informationstechnischen Systeme. Eine Auswertung der Daten zu Marketingzwecken findet in diesem Zusammenhang nicht statt. In diesen Zwecken liegt auch unser berechtigtes Interesse an der Datenverarbeitung nach Art. 6 Abs. 1 S. 1 lit. f) DSGVO.',
        },
        {
          text: 'Die Daten werden gelöscht, sobald sie für die Erreichung des Zweckes ihrer Erhebung nicht mehr erforderlich sind – in diesem Falle mit Ende des Nutzungsvorgangs. Im Fall der Speicherung der Daten in Logfiles ist dies spätestens nach sieben Tagen der Fall. Eine darüberhinausgehende Speicherung ist möglich. In diesem Fall werden die IP-Adressen gelöscht oder anonymisiert, so dass eine Zuordnung des aufrufenden Clients nicht mehr möglich ist.',
        },
        {
          text: 'Die Erfassung der Daten zur Bereitstellung der Website und die Speicherung der Daten in Logfiles ist für den Betrieb der Internetseite zwingend erforderlich, weshalb keine Widerspruchsmöglichkeit besteht.',
        },
      ],
    },

    { t: 'h2', text: '§ 4 Newsletter' },
    {
      t: 'ol',
      items: [
        {
          text: 'Mit Ihrer Einwilligung können Sie unseren kostenfreien Newsletter abonnieren, mit dem wir Sie über unsere aktuellen interessanten Angebote informieren. Die beworbenen Waren und Dienstleistungen sind in der Einwilligungserklärung benannt. Für die Anmeldung zu unserem Newsletter verwenden wir das sog. Double-opt-in-Verfahren. Das heißt, dass wir Ihnen nach Ihrer Anmeldung eine E-Mail an die angegebene E-Mail-Adresse senden, in welcher wir Sie um Bestätigung bitten, dass Sie den Versand des Newsletters wünschen. Wenn Sie Ihre Anmeldung nicht innerhalb von [24 Stunden] bestätigen, werden Ihre Informationen gesperrt und nach einem Monat automatisch gelöscht. Darüber hinaus speichern wir jeweils Ihre eingesetzten IP-Adressen und Zeitpunkte der Anmeldung und Bestätigung. Zweck des Verfahrens ist, Ihre Anmeldung nachweisen und ggf. einen möglichen Missbrauch Ihrer persönlichen Daten aufklären zu können. Pflichtangabe für die Übersendung des Newsletters ist allein Ihre E-Mail-Adresse. Die Angabe aller weiteren Daten ist freiwillig und wird verwendet, um Sie persönlich ansprechen zu können. Die Daten werden ausschließlich für den Versand des Newsletters verwendet.',
        },
        {
          text: 'Die Erhebung der E-Mail-Adresse des Nutzers dient dazu, den Newsletter zuzustellen. Die Erhebung sonstiger personenbezogener Daten im Rahmen des Anmeldevorgangs dient dazu, einen Missbrauch der Dienste oder der verwendeten E-Mail-Adresse zu verhindern.',
        },
        {
          text: 'Die Daten werden gelöscht, sobald sie für die Erreichung des Zweckes ihrer Erhebung nicht mehr erforderlich sind. Ihre E-Mail-Adresse wird demnach solange gespeichert, wie das Abonnement des Newsletters aktiv ist.',
        },
        {
          text: 'Sie können jederzeit den Empfang unseres Newsletters kündigen und damit Ihre Einwilligung widerrufen, indem Sie auf das Feld „Newsletter abbestellen" in unserem Newsletter-Abbinder klicken oder indem Sie uns eine E-Mail oder eine Nachricht an die im Impressum angegebenen Kontaktdaten senden.',
        },
        {
          text: 'Für den Versand von Newslettern verwenden wir einen externen Dienstleister. Mit dem Dienstleister wurde eine separate Auftragsdatenverarbeitung geschlossen, um den Schutz Ihrer personenbezogenen Daten zu gewährleisten. Derzeit arbeiten wir mit folgendem Dienstleister zusammen:',
        },
      ],
    },
    {
      t: 'address',
      lines: [
        'CleverReach GmbH & Co. KG',
        'Mühlenstr. 43',
        '26180 Rastede',
        'Tel.: +49 (0) 4402 97390-00',
        'E-Mail: info@cleverreach.com',
      ],
    },
    { t: 'p', text: 'Dabei werden folgende Daten an die CleverReach übermittelt:' },
    { t: 'ul', items: ['Name', 'E-Mail-Adresse', 'IP-Adresse'] },
    {
      t: 'p',
      text: 'Weitere Informationen können Sie der Datenschutzerklärung der CleverReach entnehmen, welche unter https://www.cleverreach.com/de/datenschutz/ abrufbar ist.',
    },

    { t: 'h2', text: '§ 5 Kontaktformular und E-Mail-Kontakt' },
    {
      t: 'ol',
      items: [
        {
          text: 'Auf unserer Internetseite ist ein Kontaktformular vorhanden, welches für die elektronische Kontaktaufnahme genutzt werden kann. Nehmen Sie diese Möglichkeit wahr, so werden die in der Eingabemaske eingegebenen Daten an uns übermittelt und gespeichert. Im Zeitpunkt der Absendung der Nachricht werden zudem folgende Daten gespeichert:',
          sub: ['IP-Adresse des Nutzers', 'Datum und Uhrzeit der Registrierung'],
        },
        {
          text: 'Für die Verarbeitung der Daten wird im Rahmen des Absendevorgangs Ihre Einwilligung eingeholt und auf diese Datenschutzerklärung verwiesen. Alternativ ist eine Kontaktaufnahme über die bereitgestellte E-Mail-Adresse möglich. In diesem Fall werden die mit der E-Mail übermittelten personenbezogenen Daten gespeichert. Soweit es sich hierbei um Angaben zu Kommunikationskanälen (beispielsweise E-Mail-Adresse, Telefonnummer) handelt, willigen Sie zudem ein, dass wir Sie gegebenenfalls auch über diesen Kommunikationskanal kontaktieren, um Ihr Anliegen zu beantworten. Es erfolgt in diesem Zusammenhang keine Weitergabe der Daten an Dritte. Die Daten werden ausschließlich für die Verarbeitung der Konversation verwendet.',
        },
        {
          text: 'Rechtsgrundlage für die Verarbeitung der Daten ist bei Vorliegen einer Einwilligung des Nutzers Art. 6 Abs. 1 S. lit. a) DSGVO. Rechtsgrundlage für die Verarbeitung der Daten, die im Zuge einer Übersendung einer E-Mail übermittelt werden, ist Art. 6 Abs. 1 S. 1 lit. f) DSGVO. Zielt der E-Mail-Kontakt auf den Abschluss eines Vertrages ab, so ist zusätzliche Rechtsgrundlage für die Verarbeitung Art. 6 Abs. 1 S. 1 lit. b) DSGVO.',
        },
        {
          text: 'Die Verarbeitung der personenbezogenen Daten aus der Eingabemaske dient uns allein zur Bearbeitung der Kontaktaufnahme. Die Daten aus Ihren E-Mail-Anfragen werden wir selbstverständlich ausschließlich für den Zweck verwenden, zu dem Sie uns diese bei der Kontaktierung zur Verfügung stellen. Im Falle einer Kontaktaufnahme per E-Mail liegt an deren Beantwortung auch das erforderliche berechtigte Interesse an der Verarbeitung der Daten. Die sonstigen während des Absendevorgangs verarbeiteten personenbezogenen Daten dienen dazu, einen Missbrauch des Kontaktformulars zu verhindern und die Sicherheit unserer informationstechnischen Systeme sicherzustellen.',
        },
        {
          text: 'Die Daten werden gelöscht, sobald sie für die Erreichung des Zweckes ihrer Erhebung nicht mehr erforderlich sind. Für die personenbezogenen Daten aus der Eingabemaske des Kontaktformulars und diejenigen, die per E-Mail übersandt wurden, ist dies dann der Fall, wenn die jeweilige Konversation mit dem Nutzer beendet ist. Beendet ist die Konversation dann, wenn sich aus den Umständen entnehmen lässt, dass der betroffene Sachverhalt abschließend geklärt ist.',
        },
        {
          text: 'Sie haben jederzeit die Möglichkeit, Ihre Einwilligung zur Verarbeitung der personenbezogenen Daten zu widerrufen. Nehmen Sie per E-Mail Kontakt mit uns auf, so können Sie der Speicherung Ihrer personenbezogenen Daten jederzeit widersprechen. In einem solchen Fall kann die Konversation nicht fortgeführt werden. Betreffend den Widerruf der Einwilligung bzw. den Widerspruch der Speicherung bitten wir Sie, den Verantwortlichen oder den Datenschutzbeauftragten gem. § 1 via E-Mail oder postalisch zu kontaktieren. Alle personenbezogenen Daten, die im Zuge der Kontaktaufnahme gespeichert wurden, werden in diesem Fall gelöscht.',
        },
      ],
    },

    { t: 'h2', text: '§ 6 Präsenzen in Sozialen Medien' },
    {
      t: 'p',
      text: 'Wir unterhalten Social-Media-Profile innerhalb sozialer Netzwerke und verarbeiten in diesem Rahmen Daten der Nutzer, um mit den dort aktiven Nutzern zu kommunizieren oder um Informationen über uns anzubieten.',
    },
    {
      t: 'p',
      text: 'Wir weisen darauf hin, dass dabei Daten der Nutzer außerhalb des Raumes der Europäischen Union verarbeitet werden können. Hierdurch können sich für die Nutzer Risiken ergeben, weil so z. B. die Durchsetzung der Rechte der Nutzer erschwert werden könnte.',
    },
    {
      t: 'p',
      text: 'Ferner werden die Daten der Nutzer innerhalb sozialer Netzwerke im Regelfall für Marktforschungs- und Werbezwecke verarbeitet. So können z. B. anhand des Nutzungsverhaltens und sich daraus ergebender Interessen der Nutzer Nutzungsprofile erstellt werden. Die Nutzungsprofile können wiederum verwendet werden, um z. B. Werbeanzeigen innerhalb und außerhalb der Netzwerke zu schalten, die mutmaßlich den Interessen der Nutzer entsprechen. Zu diesen Zwecken werden im Regelfall Cookies auf den Rechnern der Nutzer gespeichert, in denen das Nutzungsverhalten und die Interessen der Nutzer gespeichert werden. Ferner können in den Nutzungsprofilen auch Daten unabhängig der von den Nutzern verwendeten Geräte gespeichert werden (insbesondere, wenn die Nutzer Mitglieder der jeweiligen Plattformen sind und bei diesen eingeloggt sind).',
    },
    {
      t: 'p',
      text: 'Für eine detaillierte Darstellung der jeweiligen Verarbeitungsformen und der Widerspruchsmöglichkeiten (Opt-out) verweisen wir auf die Datenschutzerklärungen und Angaben der Betreiber der jeweiligen Netzwerke.',
    },
    {
      t: 'p',
      text: 'Auch im Fall von Auskunftsanfragen und der Geltendmachung von Betroffenenrechten weisen wir darauf hin, dass diese am effektivsten bei den Anbietern geltend gemacht werden können. Nur die Anbieter haben jeweils Zugriff auf die Daten der Nutzer und können direkt entsprechende Maßnahmen ergreifen und Auskünfte geben. Sollten Sie dennoch Hilfe benötigen, dann können Sie sich an uns wenden.',
    },
    {
      t: 'ul',
      items: [
        'Verarbeitete Datenarten: Bestandsdaten (z. B. Namen, Adressen), Kontaktdaten (z. B. E-Mail, Telefonnummern), Inhaltsdaten (z. B. Eingaben in Onlineformularen), Nutzungsdaten (z. B. besuchte Webseiten, Interesse an Inhalten, Zugriffszeiten), Meta-/Kommunikationsdaten (z. B. Geräte-Informationen, IP-Adressen).',
        'Betroffene Personen: Nutzer (z. B. Webseitenbesucher, Nutzer von Onlinediensten).',
        'Zwecke der Verarbeitung: Kontaktanfragen und Kommunikation, Tracking (z. B. interessens-/verhaltensbezogenes Profiling, Nutzung von Cookies), Remarketing, Reichweitenmessung (z. B. Zugriffsstatistiken, Erkennung wiederkehrender Besucher).',
        'Rechtsgrundlagen: Berechtigte Interessen (Art. 6 Abs. 1 S. 1 lit. f) DSGVO).',
      ],
    },

    { t: 'h2', text: '§ 7 Kinder' },
    {
      t: 'p',
      text: 'Unser Angebot richtet sich grundsätzlich an Erwachsene. Personen unter 18 Jahren sollten ohne Zustimmung der Eltern oder Erziehungsberechtigten keine personenbezogenen Daten an uns übermitteln.',
    },

    { t: 'h2', text: '§ 8 Rechte der betroffenen Person' },
    {
      t: 'p',
      text: 'Werden personenbezogene Daten von Ihnen verarbeitet, sind Sie Betroffener i. S. d. DSGVO und es stehen Ihnen folgende Rechte gegenüber dem Verantwortlichen zu:',
    },
    {
      t: 'ul',
      items: [
        'Recht auf Auskunft',
        'Recht auf Berichtigung',
        'Recht auf Einschränkung der Verarbeitung',
        'Recht auf Löschung',
        'Recht auf Unterrichtung',
        'Recht auf Datenübertragbarkeit',
        'Recht auf Widerspruch gegen die Verarbeitung',
        'Recht auf Widerruf der datenschutzrechtlichen Einwilligung',
        'Recht auf Nichtanwendung einer automatisierten Entscheidung',
        'Recht auf Beschwerde bei einer Aufsichtsbehörde',
      ],
    },

    { t: 'h3', text: '1. Auskunftsrecht' },
    {
      t: 'ol',
      items: [
        {
          text: 'Sie können von dem Verantwortlichen eine Bestätigung darüber verlangen, ob personenbezogene Daten, die Sie betreffen, von uns verarbeitet werden. Liegt eine solche Verarbeitung vor, können Sie von dem Verantwortlichen jederzeit eine unentgeltliche Auskunft über die zu Ihrer Person gespeicherten personenbezogenen Daten sowie über folgende Informationen verlangen:',
          sub: [
            'die Zwecke, zu denen die personenbezogenen Daten verarbeitet werden;',
            'die Kategorien von personenbezogenen Daten, welche verarbeitet werden;',
            'die Empfänger bzw. die Kategorien von Empfängern, gegenüber denen die Sie betreffenden personenbezogenen Daten offengelegt wurden oder noch offengelegt werden;',
            'die geplante Dauer der Speicherung der Sie betreffenden personenbezogenen Daten oder, falls konkrete Angaben hierzu nicht möglich sind, Kriterien für die Festlegung der Speicherdauer;',
            'das Bestehen eines Rechts auf Berichtigung oder Löschung der Sie betreffenden personenbezogenen Daten, eines Rechts auf Einschränkung der Verarbeitung durch den Verantwortlichen oder eines Widerspruchsrechts gegen diese Verarbeitung;',
            'das Bestehen eines Beschwerderechts bei einer Aufsichtsbehörde;',
            'alle verfügbaren Informationen über die Herkunft der Daten, wenn die personenbezogenen Daten nicht bei der betroffenen Person erhoben werden;',
            'das Bestehen einer automatisierten Entscheidungsfindung einschließlich Profiling gemäß Art. 22 Abs. 1 und 4 DSGVO und – zumindest in diesen Fällen – aussagekräftige Informationen über die involvierte Logik sowie die Tragweite und die angestrebten Auswirkungen einer derartigen Verarbeitung für die betroffene Person.',
          ],
        },
        {
          text: 'Ihnen steht das Recht zu, Auskunft darüber zu verlangen, ob die Sie betreffenden personenbezogenen Daten in ein Drittland oder an eine internationale Organisation übermittelt werden. In diesem Zusammenhang können Sie verlangen, über die geeigneten Garantien gem. Art. 46 DSGVO im Zusammenhang mit der Übermittlung unterrichtet zu werden.',
        },
      ],
    },

    { t: 'h3', text: '2. Recht auf Berichtigung' },
    {
      t: 'p',
      text: 'Sie haben ein Recht auf unverzügliche Berichtigung und/oder Vervollständigung gegenüber dem Verantwortlichen, sofern die verarbeiteten personenbezogenen Daten, die Sie betreffen, unrichtig oder unvollständig sind.',
    },

    { t: 'h3', text: '3. Recht auf Einschränkung der Verarbeitung' },
    {
      t: 'ol',
      items: [
        {
          text: 'Unter den folgenden Voraussetzungen können Sie von dem Verantwortlichen die unverzügliche Einschränkung der Verarbeitung der Sie betreffenden personenbezogenen Daten verlangen:',
          sub: [
            'wenn Sie die Richtigkeit der Sie betreffenden personenbezogenen Daten für eine Dauer bestreiten, die es dem Verantwortlichen ermöglicht, die Richtigkeit der personenbezogenen Daten zu überprüfen;',
            'die Verarbeitung unrechtmäßig ist und Sie die Löschung der personenbezogenen Daten ablehnen und stattdessen die Einschränkung der Nutzung der personenbezogenen Daten verlangen;',
            'der Verantwortliche die personenbezogenen Daten für die Zwecke der Verarbeitung nicht länger benötigt, Sie diese jedoch zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen benötigen, oder',
            'wenn Sie Widerspruch gegen die Verarbeitung gemäß Art. 21 Abs. 1 DSGVO eingelegt haben und noch nicht feststeht, ob die berechtigten Gründe des Verantwortlichen gegenüber Ihren Gründen überwiegen.',
          ],
        },
        {
          text: 'Wurde die Verarbeitung der Sie betreffenden personenbezogenen Daten eingeschränkt, dürfen diese Daten – von ihrer Speicherung abgesehen – nur mit Ihrer Einwilligung oder zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen oder zum Schutz der Rechte einer anderen natürlichen oder juristischen Person oder aus Gründen eines wichtigen öffentlichen Interesses der Union oder eines Mitgliedstaats verarbeitet werden. Wurde die Einschränkung der Verarbeitung nach den o. g. Voraussetzungen eingeschränkt, werden Sie von dem Verantwortlichen unterrichtet, bevor die Einschränkung aufgehoben wird.',
        },
      ],
    },

    { t: 'h3', text: '4. Recht auf Löschung' },
    {
      t: 'ol',
      items: [
        {
          text: 'Sie können von dem Verantwortlichen verlangen, die Sie betreffenden personenbezogenen Daten unverzüglich zu löschen, sofern einer der folgenden Gründe zutrifft:',
          sub: [
            'Die Sie betreffenden personenbezogenen Daten sind für die Zwecke, für die sie erhoben oder auf sonstige Weise verarbeitet wurden, nicht mehr notwendig.',
            'Sie widerrufen Ihre Einwilligung, auf die sich die Verarbeitung gem. Art. 6 Abs. 1 lit. a oder Art. 9 Abs. 2 lit. a DSGVO stützte, und es fehlt an einer anderweitigen Rechtsgrundlage für die Verarbeitung.',
            'Sie legen gem. Art. 21 Abs. 1 DSGVO Widerspruch gegen die Verarbeitung ein und es liegen keine vorrangigen berechtigten Gründe für die Verarbeitung vor, oder Sie legen gem. Art. 21 Abs. 2 DSGVO Widerspruch gegen die Verarbeitung ein.',
            'Die Sie betreffenden personenbezogenen Daten wurden unrechtmäßig verarbeitet.',
            'Die Löschung der Sie betreffenden personenbezogenen Daten ist zur Erfüllung einer rechtlichen Verpflichtung nach dem Unionsrecht oder dem Recht der Mitgliedstaaten erforderlich, dem der Verantwortliche unterliegt.',
            'Die Sie betreffenden personenbezogenen Daten wurden in Bezug auf angebotene Dienste der Informationsgesellschaft gemäß Art. 8 Abs. 1 DSGVO erhoben.',
          ],
        },
        {
          text: 'Hat der Verantwortliche die Sie betreffenden personenbezogenen Daten öffentlich gemacht und ist er gem. Art. 17 Abs. 1 DSGVO zu deren Löschung verpflichtet, so trifft er unter Berücksichtigung der verfügbaren Technologie und der Implementierungskosten angemessene Maßnahmen, auch technischer Art, um für die Datenverarbeitung Verantwortliche, die die personenbezogenen Daten verarbeiten, darüber zu informieren, dass Sie als betroffene Person von ihnen die Löschung aller Links zu diesen personenbezogenen Daten oder von Kopien oder Replikationen dieser personenbezogenen Daten verlangt haben.',
        },
        {
          text: 'Das Recht auf Löschung besteht nicht, soweit die Verarbeitung erforderlich ist',
          sub: [
            'zur Ausübung des Rechts auf freie Meinungsäußerung und Information;',
            'zur Erfüllung einer rechtlichen Verpflichtung, die die Verarbeitung nach dem Recht der Union oder der Mitgliedstaaten, dem der Verantwortliche unterliegt, erfordert, oder zur Wahrnehmung einer Aufgabe, die im öffentlichen Interesse liegt oder in Ausübung öffentlicher Gewalt erfolgt, die dem Verantwortlichen übertragen wurde;',
            'aus Gründen des öffentlichen Interesses im Bereich der öffentlichen Gesundheit gemäß Art. 9 Abs. 2 lit. h und i sowie Art. 9 Abs. 3 DSGVO;',
            'für im öffentlichen Interesse liegende Archivzwecke, wissenschaftliche oder historische Forschungszwecke oder für statistische Zwecke gem. Art. 89 Abs. 1 DSGVO, soweit das unter Abschnitt a) genannte Recht voraussichtlich die Verwirklichung der Ziele dieser Verarbeitung unmöglich macht oder ernsthaft beeinträchtigt, oder',
            'zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen.',
          ],
        },
      ],
    },

    { t: 'h3', text: '5. Recht auf Unterrichtung' },
    {
      t: 'p',
      text: 'Haben Sie das Recht auf Berichtigung, Löschung oder Einschränkung der Verarbeitung gegenüber dem Verantwortlichen geltend gemacht, ist dieser verpflichtet, allen Empfängern, denen die Sie betreffenden personenbezogenen Daten offengelegt wurden, diese Berichtigung/Löschung/Einschränkung der Verarbeitung mitzuteilen, es sei denn, dies erweist sich als unmöglich oder ist mit einem unverhältnismäßigen Aufwand verbunden. Ihnen steht gegenüber dem Verantwortlichen das Recht zu, über diese Empfänger unterrichtet zu werden.',
    },

    { t: 'h3', text: '6. Recht auf Datenübertragbarkeit' },
    {
      t: 'ol',
      items: [
        {
          text: 'Sie haben das Recht, die Sie betreffenden personenbezogenen Daten, die Sie dem Verantwortlichen bereitgestellt haben, in einem strukturierten, gängigen und maschinenlesbaren Format zu erhalten. Außerdem haben Sie das Recht, diese Daten einem anderen Verantwortlichen ohne Behinderung durch den Verantwortlichen, dem die personenbezogenen Daten bereitgestellt wurden, zu übermitteln, sofern',
          sub: [
            'die Verarbeitung auf einer Einwilligung gem. Art. 6 Abs. 1 lit. a DSGVO oder Art. 9 Abs. 2 lit. a DSGVO oder auf einem Vertrag gem. Art. 6 Abs. 1 lit. b DSGVO beruht und',
            'die Verarbeitung mithilfe automatisierter Verfahren erfolgt.',
          ],
        },
        {
          text: 'In Ausübung dieses Rechts haben Sie ferner das Recht, zu erwirken, dass die Sie betreffenden personenbezogenen Daten direkt von einem Verantwortlichen einem anderen Verantwortlichen übermittelt werden, soweit dies technisch machbar ist. Freiheiten und Rechte anderer Personen dürfen hierdurch nicht beeinträchtigt werden.',
        },
        {
          text: 'Das Recht auf Datenübertragbarkeit gilt nicht für eine Verarbeitung personenbezogener Daten, die für die Wahrnehmung einer Aufgabe erforderlich ist, die im öffentlichen Interesse liegt oder in Ausübung öffentlicher Gewalt erfolgt, die dem Verantwortlichen übertragen wurde.',
        },
        {
          text: 'Zur Geltendmachung des Rechts auf Datenübertragbarkeit kann sich die betroffene Person jederzeit an den für die Verarbeitung Verantwortlichen wenden.',
        },
      ],
    },

    { t: 'h3', text: '7. Widerspruchsrecht' },
    {
      t: 'ol',
      items: [
        {
          text: 'Sie haben das Recht, aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit gegen die Verarbeitung der Sie betreffenden personenbezogenen Daten, die aufgrund von Art. 6 Abs. 1 lit. e oder f DSGVO erfolgt, Widerspruch einzulegen; dies gilt auch für ein auf diese Bestimmungen gestütztes Profiling.',
        },
        {
          text: 'Der Verantwortliche verarbeitet die Sie betreffenden personenbezogenen Daten nicht mehr, es sei denn, er kann zwingende schutzwürdige Gründe für die Verarbeitung nachweisen, die Ihre Interessen, Rechte und Freiheiten überwiegen, oder die Verarbeitung dient der Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen.',
        },
        {
          text: 'Werden die Sie betreffenden personenbezogenen Daten verarbeitet, um Direktwerbung zu betreiben, haben Sie das Recht, jederzeit Widerspruch gegen die Verarbeitung der Sie betreffenden personenbezogenen Daten zum Zwecke derartiger Werbung einzulegen; dies gilt auch für das Profiling, soweit es mit solcher Direktwerbung in Verbindung steht. Widersprechen Sie der Verarbeitung für Zwecke der Direktwerbung, so werden die Sie betreffenden personenbezogenen Daten nicht mehr für diese Zwecke verarbeitet.',
        },
        {
          text: 'Sie haben die Möglichkeit, im Zusammenhang mit der Nutzung von Diensten der Informationsgesellschaft – ungeachtet der Richtlinie 2002/58/EG – Ihr Widerspruchsrecht mittels automatisierter Verfahren auszuüben, bei denen technische Spezifikationen verwendet werden.',
        },
        {
          text: 'Zur Ausübung des Rechts auf Widerspruch kann sich die betroffene Person direkt an den für die Verarbeitung Verantwortlichen wenden.',
        },
      ],
    },

    { t: 'h3', text: '8. Recht auf Widerruf der datenschutzrechtlichen Einwilligungserklärung' },
    {
      t: 'p',
      text: 'Sie haben das Recht, Ihre datenschutzrechtliche Einwilligungserklärung jederzeit zu widerrufen. Durch den Widerruf der Einwilligung wird die Rechtmäßigkeit der aufgrund der Einwilligung bis zum Widerruf erfolgten Verarbeitung nicht berührt. Sie können sich hierzu an den Verantwortlichen wenden.',
    },

    { t: 'h3', text: '9. Automatisierte Entscheidung im Einzelfall einschließlich Profiling' },
    {
      t: 'ol',
      items: [
        {
          text: 'Sie haben das Recht, nicht einer ausschließlich auf einer automatisierten Verarbeitung – einschließlich Profiling – beruhenden Entscheidung unterworfen zu werden, die Ihnen gegenüber rechtliche Wirkung entfaltet oder Sie in ähnlicher Weise erheblich beeinträchtigt. Dies gilt nicht, wenn die Entscheidung',
          sub: [
            'für den Abschluss oder die Erfüllung eines Vertrags zwischen Ihnen und dem Verantwortlichen erforderlich ist,',
            'aufgrund von Rechtsvorschriften der Union oder der Mitgliedstaaten, denen der Verantwortliche unterliegt, zulässig ist und diese Rechtsvorschriften angemessene Maßnahmen zur Wahrung Ihrer Rechte und Freiheiten sowie Ihrer berechtigten Interessen enthalten, oder',
            'mit Ihrer ausdrücklichen Einwilligung erfolgt.',
          ],
        },
        {
          text: 'Allerdings dürfen diese Entscheidungen nicht auf besonderen Kategorien personenbezogener Daten nach Art. 9 Abs. 1 DSGVO beruhen, sofern nicht Art. 9 Abs. 2 lit. a oder g DSGVO gilt und angemessene Maßnahmen zum Schutz der Rechte und Freiheiten sowie Ihrer berechtigten Interessen getroffen wurden.',
        },
        {
          text: 'Hinsichtlich der in (1) und (3) genannten Fälle trifft der Verantwortliche angemessene Maßnahmen, um die Rechte und Freiheiten sowie Ihre berechtigten Interessen zu wahren, wozu mindestens das Recht auf Erwirkung des Eingreifens einer Person seitens des Verantwortlichen, auf Darlegung des eigenen Standpunkts und auf Anfechtung der Entscheidung gehört.',
        },
        {
          text: 'Möchte die betroffene Person Rechte mit Bezug auf automatisierte Entscheidungen geltend machen, kann sie sich hierzu jederzeit an den für die Verarbeitung Verantwortlichen wenden.',
        },
      ],
    },

    { t: 'h3', text: '10. Recht auf Beschwerde bei einer Aufsichtsbehörde' },
    {
      t: 'p',
      text: 'Unbeschadet eines anderweitigen verwaltungsrechtlichen oder gerichtlichen Rechtsbehelfs steht Ihnen das Recht auf Beschwerde bei einer Aufsichtsbehörde, insbesondere in dem Mitgliedstaat Ihres Aufenthaltsorts, Ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes, zu, wenn Sie der Ansicht sind, dass die Verarbeitung der Sie betreffenden personenbezogenen Daten gegen die DSGVO verstößt. Die Aufsichtsbehörde, bei der die Beschwerde eingereicht wurde, unterrichtet den Beschwerdeführer über den Stand und die Ergebnisse der Beschwerde einschließlich der Möglichkeit eines gerichtlichen Rechtsbehelfs nach Art. 78 DSGVO.',
    },

    { t: 'h2', text: '§ 9 Änderungen der Datenschutzrichtlinie' },
    {
      t: 'p',
      text: 'Wir behalten uns das Recht vor, unsere Datenschutzpraktiken und diese Richtlinie abzuändern, um sie gegebenenfalls an Änderungen relevanter Gesetze bzw. Vorschriften anzupassen oder Ihren Bedürfnissen besser gerecht zu werden. Mögliche Änderungen unserer Datenschutzpraktiken werden entsprechend an dieser Stelle bekannt gegeben. Beachten Sie hierzu bitte das aktuelle Versionsdatum der Datenschutzerklärung.',
    },
  ],
};
