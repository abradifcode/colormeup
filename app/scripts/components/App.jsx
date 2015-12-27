import React from 'react';
import reactUpdate from 'react-addons-update';
import shouldPureComponentUpdate from 'react-pure-render/function';
import { createHashHistory } from 'history';
import { autobind } from 'core-decorators';

import Colors from '../utils/Colors';
import Storage from '../utils/Storage';
import { param, deparam } from '../utils/Parameterizr';

import Loader from './common/Loader';
import Sidebar from './Sidebar';
import Header from './Header';
import Boxes from './Boxes';
import Footer from './Footer';

let history = createHashHistory({ queryKey: false });

//todo add button to randomize

class App extends React.Component {
	constructor (props) {
		super(props);

		this.state = {
			name: 'colormeup',
			version: 2.0,
			colorObj: null,
			color: '#ff0044',
			data: {},
			defaultColors: [
				'#30d22b',
				'#f05350',
				'#443348',
				'#1da6d6',
				'#fe7724',
				'#1e4d84',
				'#9bd615',
				'#4C2719',
				'#ffd200',
				'#ff0044'
			],
			hash: {},
			orders: ['asc', 'desc'],
			ready: {
				data: false,
				hash: false,
				ui: false
			},
			slider: 'hsl',
			steps: 4,
			type: 'h',
			types: {
				h: {
					name: 'Hue',
					model: 'hsl',
					optimal: 4,
					max: 360
				},
				s: {
					name: 'Saturation',
					model: 'hsl',
					optimal: 4,
					max: 100
				},
				l: {
					name: 'Lightness',
					model: 'hsl',
					optimal: 4,
					max: 100
				},
				r: {
					name: 'Red',
					model: 'rgb',
					optimal: 5,
					max: 255
				},
				g: {
					name: 'Green',
					model: 'rgb',
					optimal: 5,
					max: 255
				},
				b: {
					name: 'Blue',
					model: 'rgb',
					optimal: 5,
					max: 255
				}
			}
		};
	}

	static childContextTypes = {
		log: React.PropTypes.func,
		setColor: React.PropTypes.func,
		setHash: React.PropTypes.func,
		setOptions: React.PropTypes.func
	};

	getChildContext () {
		return {
			log: this.log,
			setColor: this.setColor,
			setHash: this.setHash,
			setOptions: this.setOptions
		};
	}

	static propTypes = {
		location: React.PropTypes.object
	}

	shouldComponentUpdate = shouldPureComponentUpdate;

	componentDidMount () {
		this.getData();
	}

	componentDidUpdate (prevProps, prevState) {
		if (this.state.ready.data && prevState.ready.data !== this.state.ready.data) {
			this.getHash();
		}

		if (this.state.ready.hash && prevState.ready.hash !== this.state.ready.hash) {
			this.initialize();
		}

		if (prevState.color !== this.state.color) {
			this.setHash();
		}
	}

	initialize () {
		const state = this.state;
		let settings = Object.assign({
				type: 'h',
				order: 'desc',
				color: '',
				steps: 4
			}, state.hash),
			color = '#' + settings.color;

		this.log('initialize', settings, this.state.color, color);

		this.setState(reactUpdate(this.state, {
				color: { $set: Boolean(color) && Colors.prototype.validHex(color) ? color : state.defaultColors[Math.floor(Math.random() * state.defaultColors.length - 1) + 1] },
				type: { $set: state.types[settings.type] ? settings.type : 'h' },
				order: { $set: state.orders.indexOf(settings.order) > -1 ? settings.order : 'desc' },
				steps: { $set: settings.steps > 1 ? settings.steps : state.types[state.types[settings.type] ? settings.type : 'h'].optimal }
			}),
			() => {
				this.log('initialize:after', this.state);
				this.setColor();
			});
	}

	getData () {
		let data = Storage.getItem(this.name);
		this.log('getData');

		if (!data) {
			data = {
				version: this.state.version,
				created: Math.floor(Date.now() / 1000),
				updated: null,
				starter: true,
				help: true,
				colors: []
			};
			Storage.setItem(this.state.name, data);
		}

		this.setState(reactUpdate(this.state, {
			data: { $set: data },
			ready: { data: { $set: true } }
		}));
	}

	setData () {
		let data = this.state.data;
		this.log('setData');

		data.version = this.version;
		data.updated = Math.floor(Date.now() / 1000);

		Storage.setItem(this.name, data);
	}

	getHash () {
		let hash = Object.assign(this.state.hash, deparam(this.props.location.hash.replace('#', '')));

		this.log('getHash', hash);

		this.setState(reactUpdate(this.state, {
			hash: { $set: hash },
			ready: { hash: { $set: true } }
		}));
	}

	@autobind
	setHash () {
		let state   = this.state,
			options = {
				color: state.color.replace('#', '')
			};

/*		if (state.order !== 'desc') {
			options.order = state.order;
		}

		if (+state.steps !== 4) {
			options.steps = state.steps;
		}
*/
		this.log('setHash', options);

		if (param(options) !== param(state.hash)) {
			history.push(param(options));
		}
	}

	getColors (max) {
		const state = this.state;
		this.log('getColors', max);

		var colors = state.data.colors.length ? state.data.colors : [],
			single = colors[Math.floor(Math.random() * colors.length)],
			range  = colors.splice(0, max);

		return (!max ? colors : (max === 1 ? single : range));
	}

	@autobind
	setColor (color = this.state.color) {
		let state = {
			color
		};

		if (!this.state.colorObj) {
			state.colorObj = new Colors(color);
		}
		else {
			this.state.colorObj.setColor(color);
		}

		//this.log('setColor', color);
		this.setState(state, () => {
			if (!this.state.ready.ui) {
				this.setState(reactUpdate(this.state, {
					ready: { ui: { $set: true } }
				}));
			}
			this.log('setColor', this.state.colorObj);
		});
	}

	@autobind
	setOptions (options) {
		let state = {};
		//this.log('setOptions', options);

		if (options.color) {
			state.color = options.color;
		}
		if (options.type) {
			state.type = options.type;
		}
		if (options.steps) {
			state.steps = options.steps;
		}
		if (options.slider) {
			state.slider = options.slider;
		}

		this.setState(state);
	}

	log () {
		if (location.hostname === 'localhost') {
			console.log(...arguments);
		}
	}

	render () {
		const state = this.state;
		let html;

		if (state.ready.ui) {
			html = (
				<div className="app--inner">
					<Sidebar config={state} />
					<Header config={state} />
					<Boxes config={state} />
				</div>
			);
		}
		else {
			html = <Loader />;
		}

		return (
			<div className="app" style={{ minHeight: window.innerHeight }}>
				{html}
				<Footer />
				<div className="app__message">Mensagem de erro</div>
				<div className="app-overlay"></div>
			</div>
		);
	}
}

export default App;
