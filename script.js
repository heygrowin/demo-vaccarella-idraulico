/* messina-06 demo script (from la-dolceria) — smooth anchors, treatment picker,
   and ONE form handler: validate -> show a summary screen -> open the
   business's own published channel (wa.me / mailto / tel) prefilled.
   No fake "inviato": nothing is sent by the page itself. */
(function () {
  'use strict';

  function enc(s) { return encodeURIComponent(s); }
  function digits(s) { return (s || '').replace(/\D/g, ''); }
  function waNumber(target) {
    var d = digits(target);
    return d.indexOf('39') === 0 ? d : '39' + d;
  }
  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* smooth in-page scroll */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute('href');
    if (!id || id.length < 2) return;
    var el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    var focusable = el.querySelector('input, select, textarea, [tabindex]');
    if (focusable) { try { focusable.focus({ preventScroll: true }); } catch (x) {} }
  });

  /* treatment / option chips: fill the matching field, then jump to the form */
  var chips = document.querySelectorAll('[data-pick]');
  for (var c = 0; c < chips.length; c++) {
    chips[c].addEventListener('click', function () {
      var val = this.getAttribute('data-pick');
      var field = document.querySelector('[data-pickfill]');
      if (field) {
        if (field.tagName === 'SELECT') {
          var found = false, i;
          for (i = 0; i < field.options.length; i++) {
            if (field.options[i].value === val || field.options[i].text === val) { field.selectedIndex = i; found = true; break; }
          }
          if (!found) { var o = document.createElement('option'); o.text = val; o.value = val; field.add(o); field.value = val; }
        } else {
          field.value = val;
        }
      }
      var form = document.querySelector('form[data-contact]');
      if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (field) { try { field.focus({ preventScroll: true }); } catch (x) {} }
      }
    });
  }

  /* the one form handler */
  var forms = document.querySelectorAll('form[data-contact]');
  for (var f = 0; f < forms.length; f++) {
    forms[f].addEventListener('submit', function (e) {
      e.preventDefault();
      var form = this;
      var note = form.querySelector('.form-note');
      var summary = form.querySelector('.form-summary');

      /* validate required fields (text + checkbox) */
      var reqs = form.querySelectorAll('[required]');
      var missing = null;
      for (var i = 0; i < reqs.length; i++) {
        var el = reqs[i];
        var ok = (el.type === 'checkbox') ? el.checked : String(el.value || '').trim() !== '';
        if (!ok) { missing = el; break; }
      }
      if (missing) {
        if (note) { note.textContent = 'Controlla i campi obbligatori (segnati con *) prima di continuare.'; note.className = 'form-note err show'; }
        if (summary) summary.hidden = true;
        try { missing.focus(); } catch (x) {}
        return;
      }

      /* build the message + the summary from labelled fields */
      var channel = form.getAttribute('data-channel');
      var target = form.getAttribute('data-target');
      var intro = form.getAttribute('data-intro') || 'Richiesta dal sito';
      var fields = form.querySelectorAll('[data-label]');
      var lines = [intro, ''];
      var rows = '';
      for (var j = 0; j < fields.length; j++) {
        var fel = fields[j];
        if (fel.type === 'checkbox') continue;
        var label = fel.getAttribute('data-label');
        var val = String(fel.value || '').trim();
        if (!val) continue;
        lines.push(label + ': ' + val);
        rows += '<dt>' + escHtml(label) + '</dt><dd>' + escHtml(val) + '</dd>';
      }
      var msg = lines.join('\n');

      /* summary screen (shown before the channel opens) */
      if (summary) {
        summary.innerHTML = '<h3>Riepilogo della richiesta</h3><dl class="sum-dl">' + rows + '</dl>';
        summary.hidden = false;
      }

      /* channel URL + honest wording of exactly what happens */
      var url, where;
      if (channel === 'whatsapp') { url = 'https://wa.me/' + waNumber(target) + '?text=' + enc(msg); where = 'WhatsApp'; }
      else if (channel === 'mailto') { url = 'mailto:' + target + '?subject=' + enc(form.getAttribute('data-subject') || intro) + '&body=' + enc(msg); where = 'la tua app di posta'; }
      else { url = 'tel:+' + waNumber(target); where = 'il telefono'; }

      if (note) {
        note.textContent = (channel === 'tel')
          ? 'Controlla il riepilogo qui sopra, poi parte la chiamata: leggi questi dati al telefono. Niente viene inviato da solo.'
          : 'Controlla il riepilogo qui sopra: si apre ' + where + ' con la richiesta già pronta. Niente viene inviato da solo — premi tu invio.';
        note.className = 'form-note ok show';
      }

      if (channel === 'tel') window.location.href = url;
      else window.open(url, '_blank', 'noopener');

      if (summary) { try { summary.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (x) {} }
    });
  }
})();
