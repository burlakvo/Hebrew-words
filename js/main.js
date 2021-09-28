jQuery(function($) {
	const $gameField = $('#gamefield');

	const settings = {
		'levelData': false,
		'wordsPerGame': 20,
	};

	$('body').on('click', '.btn__action', function() {
		$.ajaxSetup({ async: false });

		const action = $( this ).data('action');

		if ( 'choose_lvl' === action ) {
			const lvlSlug = $( this ).data('lvl');
			const lvlName = $( this ).text();
			let words = {};

			settings.levelData = {
				"levelSlug": lvlSlug,
				"levelName": lvlName,
			};

			$.getJSON( './json/' + lvlSlug + '.json', function( data ) {
				words = data;
			});

			prepareLevelData(words);
			prepareLevelHTML();
		} else if ( 'choose_answer' === action ) {
			const isCorrect = $( this ).data('correct');

			if ( isCorrect ) correctAnswer();
			else wrongAnswer();
		} else if ( 'generate_json_data' === action ) {
			generateJSONData();
		} else if ( 'show_settings' === action ) {
			const $settings = $('.settings');

			$settings.toggleClass('settings_show');
		} else if ( 'change_settings' === action ) {
			let name = '';
			let value = '';

			if ( $( this ).hasClass('radio__wrap') ) {
				const $input = $( this ).find('input');
				name = $input.attr('name');
				value = $input.val();
			} else {
				name = $( this ).attr('name');
				value = $( this ).val();
			}

			changeSettings(name, value);
		}
	});

	init();

	function init() {
		const $tmpLevels = $('#template_choose-level');

		const $levels = $tmpLevels.contents().clone();
		$gameField.html( $levels );

		const wordsPerGame = settings.wordsPerGame;
		$('.settings').find('input[name=wordsPerGame][value=' + wordsPerGame + ']').prop('checked', true);
	}

	function prepareLevelData(words) {
		const wordsTotNum = Object.keys(words).length;
		const wordsPerGame = settings.wordsPerGame > 0 && settings.wordsPerGame <= wordsTotNum ? settings.wordsPerGame : wordsTotNum;

		settings.levelData.words = {};
		settings.levelData.options = {};

		for (let i = 0; i < wordsPerGame; i++) {
			const keys = Object.keys(words);
			const length = keys.length;

			const randomNumber = Math.floor(Math.random() * length);
			const key = keys[randomNumber];
			const wordData = words[key];

			delete words[key];

			settings.levelData.words[key] = wordData.he;
			settings.levelData.options[key] = wordData.ru;
		}

		if (Object.keys(words).length > 0) {
			const extraOptionsNum = wordsPerGame * 3;

			for (let i = 0; i < extraOptionsNum; i++) {
				const keys = Object.keys(words);
				const length = keys.length;

				if (length === 0) break;

				const randomNumber = Math.floor(Math.random() * length);
				const key = keys[randomNumber];
				const wordData = words[key];

				delete words[key];

				settings.levelData.options[key] = wordData.ru;
			}
		}
	}

	function prepareLevelHTML() {
		const $tmp1f4Header = $('#template__1from4_header');
		const wordsTotNum = Object.keys(settings.levelData.words).length;
		const wordsPerGame = settings.wordsPerGame > 0 && settings.wordsPerGame <= wordsTotNum ? settings.wordsPerGame : wordsTotNum;
		const lvlName = settings.levelData.levelName;

		const $1f4Header = $tmp1f4Header.contents().clone();
		$1f4Header.find('.gamefield__lvl-name').text(lvlName);
		$1f4Header.find('.gamefield__word-num_cur').text('1');
		$1f4Header.find('.gamefield__word-num_tot').text(wordsPerGame);

		$gameField.html('');
		$gameField.append($1f4Header);

		setWordHTML();
	}

	function correctAnswer() {
		const $curNum = $gameField.find('.gamefield__word-num_cur');
		const $totNum = $gameField.find('.gamefield__word-num_tot');
		const totNum = parseInt( $totNum.text() );
		let curNum = parseInt( $curNum.text() );

		const $statisticsForm = $gameField.find('.gamefield__header .gamefield__form-statistics');
		let corNum = parseInt( $statisticsForm.find('[name=correct]').val() );
		corNum++;
		$statisticsForm.find('[name=correct]').val(corNum);

		$('body').removeClass('choice_wrong choice_animate').addClass('choice_right');
		void $('body')[0].offsetWidth; // just for magic
		$('body').addClass('choice_animate');

		if ( curNum == totNum ) {
			showGameResult();

			return;
		}

		curNum++;
		$curNum.text(curNum);

		setWordHTML();
	}

	function wrongAnswer() {
		const $statisticsForm = $gameField.find('.gamefield__header .gamefield__form-statistics');
		let wrongNum = parseInt( $statisticsForm.find('[name=wrong]').val() );
		wrongNum++;
		$statisticsForm.find('[name=wrong]').val(wrongNum);

		$('body').removeClass('choice_right choice_animate').addClass('choice_wrong');
		void $('body')[0].offsetWidth; // just for magic
		$('body').addClass('choice_animate');
	}

	function setWordHTML() {
		const $tmp1f4Body = $('#template__1from4_body');
		const lvlData = JSON.parse(JSON.stringify(settings.levelData));

		let keys = Object.keys(lvlData.words);
		let length = keys.length;
		let randomNumber = Math.floor(Math.random() * length);
		let key = keys[randomNumber];

		const word = lvlData.words[key];
		const correct = Math.floor(Math.random() * 4);
		const options = [];

		delete settings.levelData.words[key];

		options[correct] = lvlData.options[key];

		delete lvlData.options[key];

		for (let i = 0; i < 4; i++) {
			if ( correct == i ) continue;

			let keys = Object.keys(lvlData.options);
			let length = keys.length;
			let randomNumber = Math.floor(Math.random() * length);
			let key = keys[randomNumber];

			options[i] = lvlData.options[key];

			delete lvlData.options[key];
		}

		const $1f4Body = $tmp1f4Body.contents().clone();
		$1f4Body.find('.gamefield__word').text(word);
		$1f4Body.find('.gamefield__option').each(function(index){
			$(this).text(options[index]);

			const isCorrect = correct == index;
			$(this).data('correct', isCorrect);
		});

		if ( $gameField.find('.gamefield__body').length > 0 ) $gameField.find('.gamefield__body').remove();

		$gameField.append($1f4Body);
	}

	function showGameResult() {
		const $tmp1f4Results = $('#template__1from4_results');
		const $tmp1f4Statistic = $('#template__1from4_result-statistic');
		const $1f4Results = $tmp1f4Results.contents().clone();
		const $statistics = $1f4Results.find('.gamefield__statistics');

		const $statisticsForm = $gameField.find('.gamefield__header .gamefield__form-statistics');
		const statisticsDataKeys = ['correct', 'wrong'];

		$.each(statisticsDataKeys, function(key, name) {
			const statVal = parseInt( $statisticsForm.find('[name=' + name + ']').val() );
			const $statistic = $tmp1f4Statistic.contents().clone();
			$statistic.find('.gamefield__statistic-title').text(name);
			$statistic.find('.gamefield__statistic-value').text(statVal);

			$statistics.append($statistic);
		});

		$gameField.find('.gamefield__body').remove();

		$gameField.append($1f4Results);
	}

	function changeSettings(name, value) {
		settings[name] = value;
	}

	// generate json

	function generateJSONData() {
		const $dataSource = $('#json-data');
		const data = $dataSource.val().split("\n");
		const json = {};

		$.each(data, function(index, value) {
			const line = value.split("	");

			const ru = line[0];
			const he = line[1];
			const key = transliteration(ru);

			json[key] = {
				ru,
				he
			};
		});

		$dataSource.val(JSON.stringify(json));
	}

	function transliteration(word) {
		const map = [
			["ӓ", "a"], ["ӓ̄", "a"], ["ӑ", "a"], ["а̄", "a"], ["ӕ", "ae"], ["а́", "a"], ["а̊", "a"],
			["ә", "a"], ["ӛ", "a"], ["я", "a"], ["ѫ", "a"], ["а", "a"], ["б", "b"], ["в", "v"],
			["ѓ", "g"], ["ґ", "g"], ["ғ", "g"], ["ҕ", "g"], ["г", "g"], ["һ", "h"], ["д", "d"],
			["ђ", "d"], ["ӗ", "e"], ["ё", "e"], ["є", "e"], ["э", "e"], ["ѣ", "e"], ["е", "e"],
			["ж", "zh"], ["җ", "zh"], ["ӝ", "zh"], ["ӂ", "zh"], ["ӟ", "z"], ["ӡ", "z"], ["ѕ", "z"],
			["з", "z"], ["ӣ", "j"], ["и́", "i"], ["ӥ", "i"], ["і", "i"], ["ї", "ji"], ["і̄", "i"],
			["и", "i"], ["ј", "j"], ["ј̵", "j"], ["й", "j"], ["ќ", "k"], ["ӄ", "k"], ["ҝ", "k"],
			["ҡ", "k"], ["ҟ", "k"], ["қ", "k"], ["к̨", "k"], ["к", "k"], ["ԛ", "q"], ["љ", "l"],
			["Л’", "l"], ["ԡ", "l"], ["л", "l"], ["м", "m"], ["њ", "n"], ["ң", "n"], ["ӊ", "n"],
			["ҥ", "n"], ["ԋ", "n"], ["ԣ", "n"], ["ӈ", "n"], ["н̄", "n"], ["н", "n"], ["ӧ", "o"],
			["ө", "o"], ["ӫ", "o"], ["о̄̈", "o"], ["ҩ", "o"], ["о́", "o"], ["о̄", "o"], ["о", "o"],
			["œ", "oe"], ["ҧ", "p"], ["ԥ", "p"], ["п", "p"], ["р", "r"], ["с̀", "s"], ["ҫ", "s"],
			["ш", "sh"], ["щ", "sch"], ["с", "s"], ["ԏ", "t"], ["т̌", "t"], ["ҭ", "t"], ["т", "t"],
			["ӱ", "u"], ["ӯ", "u"], ["ў", "u"], ["ӳ", "u"], ["у́", "u"], ["ӱ̄", "u"], ["ү", "u"],
			["ұ", "u"], ["ӱ̄", "u"], ["ю̄", "u"], ["ю", "u"], ["у", "u"], ["ԝ", "w"], ["ѳ", "f"],
			["ф", "f"], ["ҳ", "h"], ["х", "h"], ["ћ", "c"], ["ҵ", "c"], ["џ", "d"], ["ч", "ch"],
			["ҷ", "ch"], ["ӌ", "ch"], ["ӵ", "ch"], ["ҹ", "ch"], ["ч̀", "ch"], ["ҽ", "c"], ["ҿ", "c"],
			["ц", "c"], ["ъ", "y"], ["ӹ", "y"], ["ы̄", "y"], ["ѵ", "y"], ["ы", "y"], ["ь", "y"],
			["", ""], ["Ӓ", "a"], ["Ӓ̄", "a"], ["Ӑ", "a"], ["А̄", "a"], ["Ӕ", "ae"], ["А́", "a"],
			["А̊", "a"], ["Ә", "a"], ["Ӛ", "a"], ["Я", "a"], ["Ѫ", "a"], ["А", "a"], ["Б", "b"],
			["В", "v"], ["Ѓ", "g"], ["Ґ", "g"], ["Ғ", "g"], ["Ҕ", "g"], ["Г", "g"], ["Һ", "h"],
			["Д", "d"], ["Ђ", "d"], ["Ӗ", "e"], ["Ё", "e"], ["Є", "e"], ["Э", "e"], ["Ѣ", "e"],
			["Е", "e"], ["Ж", "zh"], ["Җ", "zh"], ["Ӝ", "zh"], ["Ӂ", "zh"], ["Ӟ", "z"], ["Ӡ", "z"],
			["Ѕ", "z"], ["З", "z"], ["Ӣ", "j"], ["И́", "i"], ["Ӥ", "i"], ["І", "i"], ["Ї", "ji"],
			["І̄", "i"], ["И", "i"], ["Ј", "j"], ["Ј̵", "j"], ["Й", "j"], ["Ќ", "k"], ["Ӄ", "k"],
			["Ҝ", "k"], ["Ҡ", "k"], ["Ҟ", "k"], ["Қ", "k"], ["К̨", "k"], ["К", "k"], ["ԛ", "q"],
			["Љ", "l"], ["Л’", "l"], ["ԡ", "l"], ["Л", "l"], ["М", "m"], ["Њ", "n"], ["Ң", "n"],
			["Ӊ", "n"], ["Ҥ", "n"], ["Ԋ", "n"], ["ԣ", "n"], ["Ӈ", "n"], ["Н̄", "n"], ["Н", "n"],
			["Ӧ", "o"], ["Ө", "o"], ["Ӫ", "o"], ["О̄̈", "o"], ["Ҩ", "o"], ["О́", "o"], ["О̄", "o"],
			["О", "o"], ["Œ", "oe"], ["Ҧ", "p"], ["ԥ", "p"], ["П", "p"], ["Р", "r"], ["С̀", "s"],
			["Ҫ", "s"], ["Ш", "sh"], ["Щ", "sch"], ["С", "s"], ["Ԏ", "t"], ["Т̌", "t"], ["Ҭ", "t"],
			["Т", "t"], ["Ӱ", "u"], ["Ӯ", "u"], ["Ў", "u"], ["Ӳ", "u"], ["У́", "u"], ["Ӱ̄", "u"],
			["Ү", "u"], ["Ұ", "u"], ["Ӱ̄", "u"], ["Ю̄", "u"], ["Ю", "u"], ["У", "u"], ["ԝ", "w"],
			["Ѳ", "f"], ["Ф", "f"], ["Ҳ", "h"], ["Х", "h"], ["Ћ", "c"], ["Ҵ", "c"], ["Џ", "d"],
			["Ч", "c"], ["Ҷ", "c"], ["Ӌ", "c"], ["Ӵ", "c"], ["Ҹ", "c"], ["Ч̀", "c"], ["Ҽ", "c"],
			["Ҿ", "c"], ["Ц", "c"], ["Ъ", "y"], ["Ӹ", "y"], ["Ы̄", "y"], ["Ѵ", "y"], ["Ы", "y"],
			["Ь", "y"], ["№", ""], ["\'", ""], ["\"", ""], [";", ""], [":", ""], [",", ""],
			["\\.", ""], [">", ""], ["<", ""], ["\\?", ""], ["!", ""], ["@", ""], ["#", ""],
			["$", ""], ["%", ""], ["&", ""], ["^", ""], ["\\(", ""], ["\\)", ""], ["\\*", ""],
			["\\+", ""], ["~", ""], ["\\|", ""], ["\\{", ""], ["\\}", ""], ["\\[", ""], ["\\]", ""],
			["\\/", ""], ["`", ""], ["=", ""], ["_", ""], ["\\s", ""], ["\\s\\s", ""],
			["/[^A-Za-z0-9\-]", ""]
		];

		for(let i=0; i<map.length; i++){
			word = word.replace(new RegExp(map[i][0], "g"), map[i][1]);
		};

		return word.trim();
	}
})