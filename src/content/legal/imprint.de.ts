import type { LegalDoc } from './types';

/**
 * Impressum, transcribed verbatim from the client's Impressum.docx.
 *
 * As with the privacy notice, the wording is untouched — only the structure is
 * restored. The source ran every disclaimer heading straight into its body
 * text ("1. HaftungsbeschränkungInhalte dieser Website…"), which is why the
 * document needs three heading levels here.
 */
export const IMPRINT_DE: LegalDoc = {
  title: 'Impressum',
  blocks: [
    { t: 'lead', text: 'Betreiber dieser Website & Social-Media-Profile* gemäß § 5 TMG:' },
    {
      t: 'address',
      lines: [
        'Hamlet Holding GmbH',
        'Gewerbestr. 8',
        '87787 Wolfertschwenden (Allgäu)',
        'Deutschland',
        'Telefon: +49 (0) 831 580 90 980',
        'info@seybandgruppe.de',
      ],
    },
    { t: 'p', text: 'Geschäftsführer: Hamlet Avtandilyan' },
    {
      t: 'p',
      text: 'Sitz der Gesellschaft ist Wolfertschwenden im Allgäu. Amtsgericht Memmingen, HRB 21122.',
    },
    {
      t: 'p',
      text: 'Verantwortlich i. S. d. § 18 Abs. 2 MStV für die Inhalte: Hamlet Avtandilyan (Adresse wie oben)',
    },
    { t: 'p', text: 'Bildnachweis: Hamlet Holding GmbH' },
    {
      t: 'p',
      text: 'Die HS Projekt GmbH wird im Bereich Website & Onlinemarketing von der Agentur für Marketing & digitale Kommunikation greiterundcie. aus Kempten im Allgäu betreut.',
    },
    {
      t: 'small',
      text: '*) Die Angaben dieses Impressums gelten auch für sämtliche Social-Media-Profile der HS Projekt GmbH wie z. B. bei: XING, LinkedIn, Facebook, Instagram etc.',
    },

    { t: 'h2', text: 'Online-Streitbeilegung' },
    {
      t: 'p',
      text: 'Die Europäische Kommission stellt unter https://ec.europa.eu/consumers/odr/ eine Plattform zur Online-Streitbeilegung bereit, die Verbraucher für die Beilegung einer Streitigkeit nutzen können und auf der weitere Informationen zum Thema Streitschlichtung zu finden sind.',
    },
    {
      t: 'p',
      text: 'Wir sind weder verpflichtet noch dazu bereit, im Falle einer Streitigkeit mit einem Verbraucher an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.',
    },

    { t: 'h2', text: 'Rechtliche Hinweise / Disclaimer' },

    { t: 'h3', text: '1. Haftungsbeschränkung' },
    { t: 'h4', text: 'Inhalte dieser Website' },
    {
      t: 'p',
      text: 'Die Inhalte dieser Website werden mit größtmöglicher Sorgfalt erstellt. Der Anbieter übernimmt jedoch keine Gewähr für die Richtigkeit, Vollständigkeit und Aktualität der bereitgestellten Inhalte. Die Nutzung der Inhalte der Website erfolgt auf eigene Gefahr des Nutzers. Namentlich gekennzeichnete Beiträge geben die Meinung des jeweiligen Autors und nicht immer die Meinung des Anbieters wieder.',
    },
    { t: 'h4', text: 'Verfügbarkeit der Website' },
    {
      t: 'p',
      text: 'Der Anbieter wird sich bemühen, den Dienst möglichst unterbrechungsfrei zum Abruf anzubieten. Auch bei aller Sorgfalt können aber Ausfallzeiten nicht ausgeschlossen werden. Der Anbieter behält sich das Recht vor, sein Angebot jederzeit zu ändern oder einzustellen.',
    },
    { t: 'h4', text: 'Externe Links' },
    {
      t: 'p',
      text: 'Diese Website enthält Verknüpfungen zu Websites Dritter („externe Links"). Diese Websites unterliegen der Haftung der jeweiligen Betreiber. Der Anbieter hat bei der erstmaligen Verknüpfung der externen Links die fremden Inhalte daraufhin überprüft, ob etwaige Rechtsverstöße bestehen. Zu dem Zeitpunkt waren keine Rechtsverstöße ersichtlich. Der Anbieter hat keinerlei Einfluss auf die aktuelle und zukünftige Gestaltung und auf die Inhalte der verknüpften Seiten. Das Setzen von externen Links bedeutet nicht, dass sich der Anbieter die hinter dem Verweis oder Link liegenden Inhalte zu eigen macht. Eine ständige Kontrolle dieser externen Links ist für den Anbieter ohne konkrete Hinweise auf Rechtsverstöße nicht zumutbar. Bei Kenntnis von Rechtsverstößen werden jedoch derartige externe Links unverzüglich gelöscht.',
    },
    { t: 'h4', text: 'Kein Vertragsverhältnis' },
    {
      t: 'p',
      text: 'Mit der Nutzung der Website des Anbieters kommt keinerlei Vertragsverhältnis zwischen dem Nutzer und dem Anbieter zustande. Insofern ergeben sich auch keinerlei vertragliche oder quasivertragliche Ansprüche gegen den Anbieter.',
    },

    { t: 'h3', text: '2. Urheberrecht' },
    {
      t: 'p',
      text: 'Copyright, Nutzungsrechte und Urheberrechte liegen ganz oder teilweise bei dem oben genannten Betreiber dieser Website. Die auf dieser Website veröffentlichten Inhalte unterliegen dem deutschen Urheberrecht. Jede vom deutschen Urheberrecht nicht zugelassene Verwertung bedarf der vorherigen schriftlichen Zustimmung des Anbieters oder jeweiligen Rechteinhabers. Dies gilt insbesondere für Vervielfältigung, Bearbeitung, Übersetzung, Einspeicherung, Verarbeitung bzw. Wiedergabe von Inhalten in Datenbanken oder anderen elektronischen Medien und Systemen. Inhalte und Rechte Dritter sind dabei als solche gekennzeichnet. Die unerlaubte Vervielfältigung oder Weitergabe einzelner Inhalte oder kompletter Seiten ist nicht gestattet und strafbar. Lediglich die Herstellung von Kopien und Downloads für den persönlichen, privaten und nicht kommerziellen Gebrauch ist erlaubt.',
    },
    {
      t: 'p',
      text: 'Links zur Website des Anbieters sind jederzeit willkommen und bedürfen keiner Zustimmung durch den Anbieter der Website. Die Darstellung dieser Website in fremden Frames ist nur mit Erlaubnis zulässig.',
    },

    { t: 'h3', text: '3. Datenschutz' },
    { t: 'p', text: 'Siehe Datenschutzerklärung.' },

    { t: 'h3', text: '4. Anwendbares Recht' },
    {
      t: 'p',
      text: 'Es gilt ausschließlich das maßgebliche Recht der Bundesrepublik Deutschland.',
    },

    { t: 'h3', text: '5. Besondere Nutzungsbedingungen' },
    {
      t: 'p',
      text: 'Soweit besondere Bedingungen für einzelne Nutzungen dieser Website von den vorgenannten Nummern 1 bis 4 abweichen, wird an entsprechender Stelle ausdrücklich darauf hingewiesen. In diesem Falle gelten im jeweiligen Einzelfall die besonderen Nutzungsbedingungen.',
    },

    {
      t: 'note',
      text: 'Der Nutzung von im Rahmen der Impressumspflicht veröffentlichten Kontaktdaten durch Dritte zur Übersendung von nicht ausdrücklich angeforderter Werbung und Informationsmaterialien wird hiermit ausdrücklich widersprochen. Die Betreiber der Seiten behalten sich ausdrücklich rechtliche Schritte im Falle der unverlangten Zusendung von Werbeinformationen, etwa durch Spam-Mails, vor.',
    },
  ],
};
