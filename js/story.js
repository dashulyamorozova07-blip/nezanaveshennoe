/* Незанавешенное — данные раскадровки.
   Координаты камер и картинок — в координатах «мира» (фасад дома из Figma).
   Координаты текста — в координатах кадра (1440×900 на компьютере, 390×844 на телефоне).
   Длины (move, hold) — в процентах высоты экрана прокрутки. */
(function () {
  // [x, y, s] из Figma → прямоугольник кадра 1440×900 в мире
  const R = (x, y, s = 1) => [x, y, 1440 * s, 900 * s];

  const DESKTOP = {
    frame: [1440, 900],
    worlds: {
      W: { tiles: { dir: 'img/w/', n: 10, imgW: 1640, imgTileH: 1000, k: 1, x0: -100 } },
      H: { color: '#000' },
      K: { color: '#000' }
    },
    plates: {
      cover: { src: 'img/d/cover.webp', world: 'W', rect: [0, 0, 1440, 2153] },
      sleep: { src: 'img/d/sleep.webp', world: 'W', rect: R(-13.5, 1296) },
      light: { src: 'img/d/light.webp', world: 'W', rect: R(-13.2, 1897.8) },
      tv: { src: 'img/d/tv.webp', world: 'W', rect: R(-13, 2695.9) },
      wrong: { src: 'img/d/wrong.webp', world: 'W', rect: R(-12.9, 3498.8) },
      plant: { src: 'img/d/plant.webp', world: 'W', rect: R(253.7, 3754.2, 0.3547), focus: [0.05, 0.07, 0.48, 0.93] },
      what: { src: 'img/d/what.webp', world: 'W', rect: R(-13.2, 4237.1) },
      man: { src: 'img/d/man.webp', world: 'W', rect: R(509.7, 4518.7, 0.5055) },
      dark6: { src: 'img/d/dark6.webp', world: 'W', rect: R(-13.2, 5105.6) },
      lit6: { src: 'img/d/lit6.webp', world: 'W', rect: R(-13.2, 5105.6) },
      cat: { src: 'img/d/cat.webp', world: 'W', rect: R(261.6, 5235.5, 0.6461) },
      coat0: { src: 'img/d/coat0.webp', world: 'W', rect: R(-12.6, 5597.8) },
      coat: { src: 'img/d/coat.webp', world: 'W', rect: R(-13, 6130) },
      boxes: { src: 'img/d/boxes.webp', world: 'W', rect: R(-13, 6322) },
      notebook: { src: 'img/d/notebook.webp', world: 'W', rect: R(-13.2, 6676) },
      wait: { src: 'img/d/wait.webp', world: 'W', rect: R(-13.3, 7392.5) },
      mirror: { src: 'img/d/mirror.webp', world: 'W', rect: R(661.8, 7703.1, 0.3545), focus: [0.52, 0.07, 0.95, 0.93] },
      empty: { src: 'img/d/empty.webp', world: 'W', rect: R(-13.1, 7813.9) },
      question: { src: 'img/d/question.webp', world: 'W', rect: R(-12, 8410.2) },
      entrance: { src: 'img/d/entrance.webp', world: 'W', rect: R(-4.9, 8924) },
      ajar: { src: 'img/d/ajar.webp', world: 'W', rect: R(-4.9, 8924) },
      open: { src: 'img/d/open.webp', world: 'W', rect: R(-4.9, 8924) },
      enter: { src: 'img/d/enter.webp', world: 'W', rect: R(284.3, 9073, 0.6102) },
      darkdoor: { src: 'img/d/darkdoor.webp', world: 'W', rect: R(636.0, 9310.9, 0.1259) },
      black: { color: '#000', world: 'K', rect: [0, 0, 1440, 900] },
      horizon: { src: 'img/d/horizon.webp', world: 'H', rect: [0, 0, 1440, 900] }
    },
    cover: {
      fig: { title: '37:28396', sub: '37:28397', hint: '37:28402' },
      title: { x: 720, y: 291, text: 'Незанавешенное' },
      sub: { x: 720, y: 446, text: 'Кто живёт за этими окнами?' },
      hint: { x: 720, y: 722, text: 'спускайся по этажам' }
    },
    crow: { size: 360, y: 110, from: 1080, to: -420 },
    steps: [
      // тексты — слои из десктопных кадров Figma (см. figtext.js): fig — id слоя, at/until — шаг появления/ухода
      { id: 'cover', plate: 'cover', cam: [0, 0, 1440, 900], hold: 30, texts: [] },
      { id: 'sleep', plate: 'sleep', move: 150, texts: [{ fig: '37:24567' }] },
      { id: 'light', plate: 'light', texts: [{ fig: '37:24088' }, { fig: '37:24210', at: 1 }] },
      { id: 'tv', plate: 'tv', texts: [{ fig: '37:23846' }, { fig: '37:23967', at: 1 }] },
      { id: 'wrong', plate: 'wrong', texts: [{ fig: '37:23237' }, { fig: '37:23238', at: 1 }] },
      { id: 'plant', plate: 'plant', move: 130, texts: [
        { fig: '37:23311', until: 1 },
        { fig: '37:23553', at: 1, until: 2 }, { fig: '37:23552', at: 1, until: 2 },
        { fig: '37:23675', at: 2 }, { fig: '37:23674', at: 2 }] },
      { id: 'what', plate: 'what', move: 130, texts: [{ fig: '37:22638' }] },
      { id: 'man', plate: 'man', move: 120, texts: [
        { fig: '37:22878', until: 1 }, { fig: '37:22999', at: 1 }, { fig: '37:23000', at: 1 }] },
      { id: 'dark6', plate: 'dark6', move: 130, hold: 25, texts: [] },
      { id: 'lit6', plate: 'lit6', move: 60, hold: 20, texts: [] },
      { id: 'cat', plate: 'cat', move: 110, texts: [
        { fig: '37:22151', until: 3 }, { fig: '37:22272', at: 1, until: 3 }, { fig: '37:22394', at: 2, until: 3 },
        { fig: '37:22515', at: 3 }, { fig: '37:22514', at: 3 }] },
      { id: 'coat0', plate: 'coat0', move: 120, hold: 25, texts: [] },
      { id: 'crow', plate: 'coat0', dim: 0.84, move: 60, hold: 120, crow: true, texts: [{ fig: '37:21424' }] },
      { id: 'coat', plate: 'coat', move: 100, texts: [{ fig: '37:19971' }, { fig: '37:19972', at: 1 }] },
      { id: 'boxes', plate: 'boxes', texts: [{ fig: '37:20093' }, { fig: '37:20094', at: 1 }] },
      { id: 'notebook', plate: 'notebook', texts: [{ fig: '37:20215' }, { fig: '37:20216', at: 1 }] },
      { id: 'wait', plate: 'wait', texts: [{ fig: '37:20452' }] },
      { id: 'mirror', plate: 'mirror', move: 120, texts: [
        { fig: '37:24702', until: 1 }, { fig: '37:24824', at: 1 }, { fig: '37:24823', at: 1 }] },
      { id: 'empty', plate: 'empty', move: 130, texts: [
        { fig: '37:20937', until: 3 }, { fig: '37:20939', at: 1, until: 3 }, { fig: '37:21064', at: 2, until: 3 },
        { fig: '37:21181', at: 3 }] },
      { id: 'question', plate: 'question', dim: 0.84, move: 110, texts: [{ fig: '37:20695' }] },
      { id: 'entrance', plate: 'entrance', move: 100, texts: [{ fig: '37:18523' }] },
      { id: 'ajar', plate: 'ajar', move: 50, texts: [{ fig: '37:18539' }] },
      { id: 'open', plate: 'open', move: 50, hold: 20, texts: [] },
      { id: 'enter', plate: 'enter', move: 110, texts: [{ fig: '37:18577' }] },
      { id: 'darkdoor', plate: 'darkdoor', move: 140, texts: [{ fig: '37:18593' }] },
      { id: 'black', plate: 'black', move: 70, texts: [{ fig: '37:18595' }] },
      { id: 'horizon', plate: 'horizon', move: 110, hold: 110, final: true, texts: [{ fig: '37:25266' }, { fig: '37:25267', at: 1 }] }
    ]
  };

  // ---------- Телефон: мир 390×7601, два окна на этаж ----------
  const M = (y) => [0, y, 390, 844];
  const MOBILE = {
    frame: [390, 844],
    worlds: {
      M: { tiles: { dir: 'img/m/w', n: 13, imgW: 780, imgTileH: 1200, k: 0.5, x0: 0 } },
      W: { tiles: { dir: 'img/w/', n: 10, imgW: 1640, imgTileH: 1000, k: 1, x0: -100 } },
      H: { color: '#000' },
      K: { color: '#000' }
    },
    plates: {
      // кадры из мобильного макета «Незанавешенное мобилка»: [x, y, ширина, высота] в мире телефона
      m_cover: { src: 'img/m/cover.webp', world: 'M', rect: [0, 0, 390, 844] },
      m_plant: { src: 'img/m/plant.webp', world: 'M', rect: [50.4, 2626.8, 390 * 0.3226, 844 * 0.3226], focus: [0.06, 0.09, 0.94, 0.45] },
      m_man: { src: 'img/m/man.webp', world: 'M', rect: [48.5, 3194.7, 390 * 0.316, 844 * 0.316] },
      m_vase: { src: 'img/m/vase.webp', world: 'M', rect: [225.3, 3195.4, 390 * 0.3147, 844 * 0.3147] },
      m_manguess: { src: 'img/m/manguess.webp', world: 'M', rect: [0, 2931, 390, 844] },
      m_cat: { src: 'img/m/cat.webp', world: 'M', rect: [50.6, 3794.3, 390 * 0.3146, 844 * 0.3146] },
      m_toys: { src: 'img/m/toys.webp', world: 'M', rect: [220.5, 3794.2, 390 * 0.3159, 844 * 0.3159] },
      m_cake: { src: 'img/m/cake.webp', world: 'M', rect: [47.1, 3994.7, 390 * 0.3155, 844 * 0.3155] },
      m_catguess: { src: 'img/m/catguess.webp', world: 'M', rect: [0, 3576, 390, 844] },
      m_mirror: { src: 'img/m/mirror.webp', world: 'M', rect: [220.4, 5615.1, 390 * 0.3079, 844 * 0.3079], focus: [0.18, 0.17, 0.85, 0.62] },
      entrance: DESKTOP.plates.entrance, ajar: DESKTOP.plates.ajar, open: DESKTOP.plates.open,
      enter: DESKTOP.plates.enter, darkdoor: DESKTOP.plates.darkdoor,
      black: DESKTOP.plates.black, horizon: DESKTOP.plates.horizon
    },
    cover: {
      world: true,
      title: { x: 195, y: 297, text: 'Незанавешенное' },
      sub: { x: 195, y: 361, text: 'Кто живёт за этими окнами?' },
      hint: { x: 195, y: 655, text: 'спускайся по этажам' }
    },
    crow: { size: 163, y: 238, from: 420, to: -210 },
    steps: [
      { id: 'cover', plate: 'm_cover', cam: M(0), hold: 30, texts: [] },
      { id: 'sleep', world: 'M', cam: M(921), move: 130, texts: [
        { x: 195, y: 489, a: 'c', items: [{ c: 'wall', t: 'Почти все спят.' }] }] },
      { id: 'light', world: 'M', cam: M(1442), texts: [
        { x: 340, y: 361, a: 'r', items: [{ c: 'seen', t: 'Свет за шторой.' }, { c: 'guess', t: 'Кто-то читает.', at: 1, g: 0 }] }] },
      { id: 'tv', world: 'M', cam: M(1814), texts: [
        { x: 65, y: 197, items: [{ c: 'seen', t: 'Телевизор включён.\nДиван пустой.' }] },
        { x: 65, y: 387, items: [{ c: 'guess', t: 'Кто-то вышел на минуту,\nа телевизор ждёт.', at: 1 }] }] },
      { id: 'wrong', world: 'M', cam: M(2380), texts: [
        { x: 59, y: 247, items: [{ c: 'seen', t: 'Здесь что-то не так…' }] },
        { x: 187, y: 416, items: [{ c: 'seen', t: 'Посмотри поближе', at: 1 }] }] },
      { id: 'plant', plate: 'm_plant', move: 120, texts: [
        { x: 195, y: 554, a: 'c', w: 360, items: [{ c: 'seenL', t: 'Странно, кто-то привязал\nкрасную нитку к засохшему\nрастению.', until: 1 }] },
        { x: 195, y: 524, a: 'c', w: 360, items: [{ c: 'label', t: 'Догадка:', at: 1, until: 2 }, { c: 'guessL', t: 'Здесь живёт старая женщина.\nОна завязала красную нитку для\nкакого-то ритуала.', at: 1, until: 2 }] },
        { x: 195, y: 524, a: 'c', w: 360, items: [{ c: 'label', t: 'А может, всё иначе:', at: 2 }, { c: 'guessL', t: 'Хозяин уехал и протянул нитку\nк воде, чтобы растение было\nполито. Растение засохло.\nВидимо, он уехал надолго…', at: 2 }] }] },
      { id: 'what', world: 'M', cam: M(2904), move: 120, texts: [
        { x: 195, y: 493, a: 'c', items: [{ c: 'seen', t: 'А что тут?' }] }] },
      { id: 'man', plate: 'm_man', move: 110, texts: [
        { x: 195, y: 643, a: 'c', w: 360, items: [{ c: 'seenL', t: 'Человек стоит у стола.' }] }] },
      { id: 'vase', plate: 'm_vase', move: 90, texts: [
        { x: 195, y: 634, a: 'c', w: 360, items: [{ c: 'seenL', t: 'В соседнем окне лампа,\nа на полу разбитая ваза.' }] }] },
      { id: 'manguess', plate: 'm_manguess', move: 110, texts: [
        { x: 195, y: 617, a: 'c', w: 370, items: [{ c: 'label', t: 'Догадка' }, { c: 'guess', t: 'Наверное, они поссорились. Он ушёл\nв другую комнату и молчит. Разбитую\nвазу пока никто не собрал.' }] }] },
      { id: 'lit6', world: 'M', cam: M(3576), move: 100, hold: 25, texts: [] },
      { id: 'cat', plate: 'm_cat', move: 100, texts: [
        { x: 195, y: 612, a: 'c', w: 360, items: [{ c: 'seenL', t: 'Кот сидит на подоконнике\nи смотрит на улицу.' }] }] },
      { id: 'toys', plate: 'm_toys', move: 90, texts: [
        { x: 195, y: 612, a: 'c', w: 360, items: [{ c: 'seenL', t: 'На полу валяются\nигрушки.' }] }] },
      { id: 'cake', plate: 'm_cake', move: 90, texts: [
        { x: 195, y: 612, a: 'c', w: 360, items: [{ c: 'seenL', t: 'На столе тарелка\nс куском торта.' }] }] },
      { id: 'catguess', plate: 'm_catguess', move: 110, texts: [
        { x: 195, y: 617, a: 'c', w: 370, items: [{ c: 'label', t: 'Догадка' }, { c: 'guess', t: 'Здесь живёт семья с ребёнком и котом.\nСегодня у малыша был день рождения.\nВсе устали и легли спать, остался один\nкусок торта.' }] }] },
      { id: 'coat0', world: 'M', cam: M(3932), move: 100, hold: 25, texts: [] },
      { id: 'crow', world: 'M', cam: M(3932), dim: 0.84, move: 60, hold: 120, crow: true, texts: [
        { x: 195, y: 374, a: 'c', w: 360, items: [{ c: 'crowt', t: 'Квартиры придумала я.\nНо ты уже знаешь, кто здесь\nживёт, правда?' }] }] },
      { id: 'coat', world: 'M', cam: M(4427), move: 110, texts: [
        { x: 55, y: 364, items: [{ c: 'seen', t: 'Пальто на стуле.' }, { c: 'guess', t: 'Пришёл. Или не ушёл.', at: 1 }] }] },
      { id: 'boxes', world: 'M', cam: M(4625), texts: [
        { x: 335, y: 364, a: 'r', items: [{ c: 'seen', t: 'Женщина разбирает коробки.' }, { c: 'guess', t: 'Сюда. Или отсюда.', at: 1 }] }] },
      { id: 'notebook', world: 'M', cam: M(4828), texts: [
        { x: 55, y: 364, items: [{ c: 'seen', t: 'Тетрадь, ручка, чай.' }, { c: 'guess', t: 'Кто-то занимался допоздна.', at: 1 }] }] },
      // по мобильному макету: общий вид этажа → крупный план окна → догадка
      { id: 'wait', world: 'M', cam: M(5300), move: 110, texts: [
        { x: 335, y: 490, a: 'r', items: [{ c: 'wall', t: 'Подожди.\nЭто окно уже было' }] }] },
      { id: 'mirror', plate: 'm_mirror', move: 110, texts: [
        { x: 195, y: 554, a: 'c', w: 360, items: [{ c: 'seenL', t: 'Та же комната.\nТолько отражённая.', until: 1 }] },
        { x: 195, y: 524, a: 'c', w: 360, items: [{ c: 'label', t: 'Догадка:', at: 1 }, { c: 'guessL', t: 'Кто-то повторяет чужую жизнь\nдо мелочей.', at: 1 }] }] },
      { id: 'empty', world: 'M', cam: M(5818), move: 120, texts: [
        { x: 55, y: 364, items: [{ c: 'seen', t: 'Кровать\nзаправлена.', until: 3 }] },
        { x: 335, y: 364, a: 'r', items: [{ c: 'seen', t: 'Мебель\nпод простынёй.', at: 1, until: 3 }] },
        { x: 55, y: 566, items: [{ c: 'seen', t: 'Стол пустой.', at: 2, until: 3 }] },
        { x: 195, y: 368, a: 'c', items: [{ c: 'guess', t: 'Уехали или ещё не въехали.', at: 3 }] }] },
      { id: 'question', world: 'M', cam: M(6645), dim: 0.84, move: 110, texts: [
        { x: 195, y: 300, a: 'c', w: 350, items: [{ c: 'author', t: 'А если кто-то\nсейчас смотрит на тебя\nи придумывает твою жизнь?' }] }] },
      { id: 'entrance', plate: 'entrance', move: 90, texts: [
        { x: 195, y: 165, a: 'c', items: [{ c: 'seen', t: 'Подъезд' }] }] },
      { id: 'ajar', plate: 'ajar', move: 50, fy: 0.3, texts: [
        { x: 195, y: 165, a: 'c', items: [{ c: 'seen', t: 'Дверь приоткрыта.' }] }] },
      { id: 'open', plate: 'open', move: 50, hold: 20, texts: [] },
      { id: 'enter', plate: 'enter', move: 100, texts: [
        { x: 195, y: 70, a: 'c', w: 350, items: [{ c: 'wall', t: 'Войди. Там всё\nкак на самом деле.' }] }] },
      { id: 'darkdoor', plate: 'darkdoor', move: 130, texts: [
        { x: 195, y: 400, a: 'c', items: [{ c: 'wall', t: 'Темно.' }] }] },
      { id: 'black', plate: 'black', move: 70, texts: [
        { x: 195, y: 400, a: 'c', items: [{ c: 'wall', t: 'Никого.' }] }] },
      { id: 'horizon', plate: 'horizon', move: 110, hold: 110, final: true, texts: [
        { x: 195, y: 640, a: 'c', items: [{ c: 'seen', t: 'Снова этот дом.' }, { c: 'seenI', t: 'Кажется, ты здесь уже был.', at: 1 }] }] }
    ]
  };

  window.STORY = { DESKTOP, MOBILE };
})();
