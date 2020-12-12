
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.19.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /**
     * @typedef {Object} WrappedComponent Object returned by the `wrap` method
     * @property {SvelteComponent} component - Component to load (this is always asynchronous)
     * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
     * @property {Object} [props] - Optional dictionary of static props
     * @property {Object} [userData] - Optional user data dictionary
     * @property {bool} _sveltesparouter - Internal flag; always set to true
     */

    /**
     * @callback AsyncSvelteComponent
     * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
     */

    /**
     * @callback RoutePrecondition
     * @param {RouteDetail} detail - Route detail object
     * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
     */

    /**
     * @typedef {Object} WrapOptions Options object for the call to `wrap`
     * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
     * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
     * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
     * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
     * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
     * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
     * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
     */

    /**
     * Wraps a component to enable multiple capabilities:
     * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
     * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
     * 3. Adding static props that are passed to the component
     * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
     * 
     * @param {WrapOptions} args - Arguments object
     * @returns {WrappedComponent} Wrapped component
     */
    function wrap(args) {
        if (!args) {
            throw Error('Parameter args is required')
        }

        // We need to have one and only one of component and asyncComponent
        // This does a "XNOR"
        if (!args.component == !args.asyncComponent) {
            throw Error('One and only one of component and asyncComponent is required')
        }

        // If the component is not async, wrap it into a function returning a Promise
        if (args.component) {
            args.asyncComponent = () => Promise.resolve(args.component);
        }

        // Parameter asyncComponent and each item of conditions must be functions
        if (typeof args.asyncComponent != 'function') {
            throw Error('Parameter asyncComponent must be a function')
        }
        if (args.conditions) {
            // Ensure it's an array
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions];
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Check if we have a placeholder component
        if (args.loadingComponent) {
            args.asyncComponent.loading = args.loadingComponent;
            args.asyncComponent.loadingParams = args.loadingParams || undefined;
        }

        // Returns an object that contains all the functions to execute too
        // The _sveltesparouter flag is to confirm the object was created by this router
        const obj = {
            component: args.asyncComponent,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            _sveltesparouter: true
        };

        return obj
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules\svelte-spa-router\Router.svelte generated by Svelte v3.19.1 */

    const { Error: Error_1, Object: Object_1, console: console_1 } = globals;

    // (209:0) {:else}
    function create_else_block(ctx) {
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[14]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[14]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(209:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (202:0) {#if componentParams}
    function create_if_block(ctx) {
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[13]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[13]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(202:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap$1(component, userData, ...conditions) {
    	// Use the new wrap method and show a deprecation warning
    	// eslint-disable-next-line no-console
    	console.warn("Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading");

    	return wrap({ component, userData, conditions });
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	// Check if there's a querystring
    	const qsPosition = location.indexOf("?");

    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == "#" ? "" : "#") + location;

    	try {
    		window.history.replaceState(undefined, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn("Caught exception while replacing the current page. If you're running this in the Svelte REPL, please note that the `replace` method might not work in this environment.");
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event("hashchange"));
    }

    function link(node, hrefVar) {
    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
    		throw Error("Action \"link\" can only be used with <a> tags");
    	}

    	updateLink(node, hrefVar || node.getAttribute("href"));

    	return {
    		update(updated) {
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, href) {
    	// Destination must start with '/'
    	if (!href || href.length < 1 || href.charAt(0) != "/") {
    		throw Error("Invalid value for \"href\" attribute: " + href);
    	}

    	// Add # to the href attribute
    	node.setAttribute("href", "#" + href);

    	node.addEventListener("click", scrollstateHistoryHandler);
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {HTMLElementEventMap} event - an onclick event attached to an anchor tag
     */
    function scrollstateHistoryHandler(event) {
    	// Prevent default anchor onclick behaviour
    	event.preventDefault();

    	const href = event.currentTarget.getAttribute("href");

    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument - strings must start with / or *");
    			}

    			const { pattern, keys } = regexparam(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, check if it matches the start of the path.
    			// If not, bail early, else remove it before we run the matching.
    			if (prefix) {
    				if (typeof prefix == "string") {
    					if (path.startsWith(prefix)) {
    						path = path.substr(prefix.length) || "/";
    					} else {
    						return null;
    					}
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || "/";
    					} else {
    						return null;
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || "") || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {bool} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	if (restoreScrollState) {
    		window.addEventListener("popstate", event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		});

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.scrollX, previousScrollState.scrollY);
    			} else {
    				// Otherwise this is a forward navigation: scroll to top
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick("conditionsFailed", detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoading", Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == "object" && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    	});

    	const writable_props = ["routes", "prefix", "restoreScrollState"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble($$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		derived,
    		tick,
    		_wrap: wrap,
    		wrap: wrap$1,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		scrollstateHistoryHandler,
    		console,
    		window,
    		Error,
    		history,
    		undefined,
    		Event,
    		createEventDispatcher,
    		afterUpdate,
    		regexparam,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		lastLoc,
    		componentObj,
    		RegExp,
    		Promise,
    		decodeURIComponent,
    		Map,
    		Object
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ("props" in $$props) $$invalidate(2, props = $$props.props);
    		if ("previousScrollState" in $$props) previousScrollState = $$props.previousScrollState;
    		if ("lastLoc" in $$props) lastLoc = $$props.lastLoc;
    		if ("componentObj" in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			 history.scrollRestoration = restoreScrollState ? "manual" : "auto";
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		previousScrollState,
    		lastLoc,
    		componentObj,
    		RouteItem,
    		routesList,
    		dispatch,
    		dispatchNextTick,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var data = [{id:1,first_name:"Ethel",last_name:"Blowes",email:"eblowes1@i2i.jp",rank:"Recruiter",work_started:"2020-12-06",shift_hours:"8:00 AM - 4:00 PM"},{id:2,first_name:"Rubina",last_name:"Herley",email:"rherley2@epa.gov",rank:"Editor",work_started:"2020-12-23",shift_hours:"8:00 AM - 4:00 PM"},{id:3,first_name:"Nial",last_name:"Pareman",email:"npareman3@hugedomains.com",rank:"Registered Nurse",work_started:"2019-08-07",shift_hours:"8:00 AM - 4:00 PM"},{id:4,first_name:"Cindelyn",last_name:"Mizen",email:"cmizen4@cisco.com",rank:"VP Accounting",work_started:"2019-04-24",shift_hours:"8:00 AM - 4:00 PM"},{id:5,first_name:"Sibbie",last_name:"Dunkerton",email:"sdunkerton5@rediff.com",rank:"Budget/Accounting Analyst II",work_started:"2019-09-12",shift_hours:"8:00 AM - 4:00 PM"}];

    const fs = require('fs');

    const employees = writable(data);

    function UpdateEmployees(newData) {
        console.log('STARTED UPDATING ');

        fs.writeFile('./src/employees.json', JSON.stringify(newData, null, 2), (err) => {
            if (err) console.error('🟥 ERR', err);
        });
    }


    // [{
    //     "id": 1,
    //     "first_name": "Edvard",
    //     "last_name": "Verick",
    //     "email": "everick0@bandcamp.com",
    //     "rank": "Desktop Support Technician",
    //     "work_started": "",
    //     "shift_hours": ""
    // },

    // {
    //     "id": 2,
    //     "first_name": "Ethel",
    //     "last_name": "Blowes",
    //     "email": "eblowes1@i2i.jp",
    //     "rank": "Recruiter",
    //     "work_started": "",
    //     "shift_hours": ""
    // },
    // {
    //     "id": 3,
    //     "first_name": "Rubina",
    //     "last_name": "Herley",
    //     "email": "rherley2@epa.gov",
    //     "rank": "Editor",
    //     "work_started": "",
    //     "shift_hours": ""
    // },
    // {
    //     "id": 4,
    //     "first_name": "Nial",
    //     "last_name": "Pareman",
    //     "email": "npareman3@hugedomains.com",
    //     "rank": "Registered Nurse",
    //     "work_started": "",
    //     "shift_hours": ""
    // },
    // {
    //     "id": 5,
    //     "first_name": "Cindelyn",
    //     "last_name": "Mizen",
    //     "email": "cmizen4@cisco.com",
    //     "rank": "VP Accounting",
    //     "work_started": "",
    //     "shift_hours": ""
    // },
    // {
    //     "id": 6,
    //     "first_name": "Sibbie",
    //     "last_name": "Dunkerton",
    //     "email": "sdunkerton5@rediff.com",
    //     "rank": "Budget/Accounting Analyst II",
    //     "work_started": "",
    //     "shift_hours": ""
    // },
    // {
    //     "id": 7,
    //     "first_name": "Ebba",
    //     "last_name": "Gianotti",
    //     "email": "egianotti6@amazon.de",
    //     "rank": "Account Executive",
    //     "work_started": "",
    //     "shift_hours": ""
    // }
    // ]

    /* src\routes\Main.svelte generated by Svelte v3.19.1 */
    const file = "src\\routes\\Main.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	child_ctx[5] = i;
    	return child_ctx;
    }

    // (60:16) {#if emp_list && emp_list.length > 0}
    function create_if_block$1(ctx) {
    	let each_1_anchor;
    	let each_value = /*emp_list*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*deleteEmp, emp_list*/ 3) {
    				each_value = /*emp_list*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(60:16) {#if emp_list && emp_list.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (61:20) {#each emp_list as emp, i}
    function create_each_block(ctx) {
    	let tr;
    	let th;
    	let t0_value = /*emp*/ ctx[3].id + "";
    	let t0;
    	let t1;
    	let td0;
    	let t2_value = /*emp*/ ctx[3].first_name + "";
    	let t2;
    	let t3;
    	let td1;
    	let t4_value = /*emp*/ ctx[3].last_name + "";
    	let t4;
    	let t5;
    	let td2;
    	let t6_value = /*emp*/ ctx[3].email + "";
    	let t6;
    	let t7;
    	let td3;
    	let t8_value = /*emp*/ ctx[3].rank + "";
    	let t8;
    	let t9;
    	let td4;
    	let t10_value = /*emp*/ ctx[3].work_started + "";
    	let t10;
    	let t11;
    	let td5;
    	let t12_value = /*emp*/ ctx[3].shift_hours + "";
    	let t12;
    	let t13;
    	let td6;
    	let a;
    	let link_action;
    	let t15;
    	let td7;
    	let button;
    	let t17;
    	let dispose;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			th = element("th");
    			t0 = text(t0_value);
    			t1 = space();
    			td0 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td1 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td2 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			td3 = element("td");
    			t8 = text(t8_value);
    			t9 = space();
    			td4 = element("td");
    			t10 = text(t10_value);
    			t11 = space();
    			td5 = element("td");
    			t12 = text(t12_value);
    			t13 = space();
    			td6 = element("td");
    			a = element("a");
    			a.textContent = "Update";
    			t15 = space();
    			td7 = element("td");
    			button = element("button");
    			button.textContent = "Delete";
    			t17 = space();
    			attr_dev(th, "scope", "row");
    			add_location(th, file, 62, 28, 1638);
    			add_location(td0, file, 63, 28, 1697);
    			add_location(td1, file, 64, 28, 1752);
    			add_location(td2, file, 65, 28, 1806);
    			add_location(td3, file, 66, 28, 1856);
    			add_location(td4, file, 67, 28, 1905);
    			add_location(td5, file, 68, 28, 1962);
    			attr_dev(a, "class", "btn btn-outline-primary");
    			add_location(a, file, 70, 32, 2056);
    			add_location(td6, file, 69, 28, 2018);
    			attr_dev(button, "class", "btn btn-outline-danger");
    			add_location(button, file, 73, 28, 2231);
    			add_location(td7, file, 72, 28, 2197);
    			add_location(tr, file, 61, 24, 1604);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, th);
    			append_dev(th, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td0);
    			append_dev(td0, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td1);
    			append_dev(td1, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td2);
    			append_dev(td2, t6);
    			append_dev(tr, t7);
    			append_dev(tr, td3);
    			append_dev(td3, t8);
    			append_dev(tr, t9);
    			append_dev(tr, td4);
    			append_dev(td4, t10);
    			append_dev(tr, t11);
    			append_dev(tr, td5);
    			append_dev(td5, t12);
    			append_dev(tr, t13);
    			append_dev(tr, td6);
    			append_dev(td6, a);
    			append_dev(tr, t15);
    			append_dev(tr, td7);
    			append_dev(td7, button);
    			append_dev(tr, t17);

    			dispose = [
    				action_destroyer(link_action = link.call(null, a, `/update/${/*emp*/ ctx[3].id}`)),
    				listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*deleteEmp*/ ctx[1](/*emp*/ ctx[3].id))) /*deleteEmp*/ ctx[1](/*emp*/ ctx[3].id).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				)
    			];
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*emp_list*/ 1 && t0_value !== (t0_value = /*emp*/ ctx[3].id + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*emp_list*/ 1 && t2_value !== (t2_value = /*emp*/ ctx[3].first_name + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*emp_list*/ 1 && t4_value !== (t4_value = /*emp*/ ctx[3].last_name + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*emp_list*/ 1 && t6_value !== (t6_value = /*emp*/ ctx[3].email + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*emp_list*/ 1 && t8_value !== (t8_value = /*emp*/ ctx[3].rank + "")) set_data_dev(t8, t8_value);
    			if (dirty & /*emp_list*/ 1 && t10_value !== (t10_value = /*emp*/ ctx[3].work_started + "")) set_data_dev(t10, t10_value);
    			if (dirty & /*emp_list*/ 1 && t12_value !== (t12_value = /*emp*/ ctx[3].shift_hours + "")) set_data_dev(t12, t12_value);
    			if (link_action && is_function(link_action.update) && dirty & /*emp_list*/ 1) link_action.update.call(null, `/update/${/*emp*/ ctx[3].id}`);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(61:20) {#each emp_list as emp, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div1;
    	let div0;
    	let h1;
    	let t1;
    	let a0;
    	let link_action;
    	let t3;
    	let a1;
    	let link_action_1;
    	let t5;
    	let a2;
    	let link_action_2;
    	let t7;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t9;
    	let th1;
    	let t11;
    	let th2;
    	let t13;
    	let th3;
    	let t15;
    	let th4;
    	let t17;
    	let th5;
    	let t19;
    	let th6;
    	let t21;
    	let th7;
    	let t23;
    	let th8;
    	let t25;
    	let tbody;
    	let dispose;
    	let if_block = /*emp_list*/ ctx[0] && /*emp_list*/ ctx[0].length > 0 && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Welcome Administrator";
    			t1 = space();
    			a0 = element("a");
    			a0.textContent = "Login";
    			t3 = space();
    			a1 = element("a");
    			a1.textContent = "Register";
    			t5 = space();
    			a2 = element("a");
    			a2.textContent = "Create New Employee";
    			t7 = space();
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "#";
    			t9 = space();
    			th1 = element("th");
    			th1.textContent = "First";
    			t11 = space();
    			th2 = element("th");
    			th2.textContent = "Last";
    			t13 = space();
    			th3 = element("th");
    			th3.textContent = "Email";
    			t15 = space();
    			th4 = element("th");
    			th4.textContent = "Rank";
    			t17 = space();
    			th5 = element("th");
    			th5.textContent = "Work Started";
    			t19 = space();
    			th6 = element("th");
    			th6.textContent = "Shift Hours";
    			t21 = space();
    			th7 = element("th");
    			th7.textContent = "Update";
    			t23 = space();
    			th8 = element("th");
    			th8.textContent = "Delete";
    			t25 = space();
    			tbody = element("tbody");
    			if (if_block) if_block.c();
    			set_style(h1, "margin-bottom", "50px");
    			set_style(h1, "margin-top", "100px");
    			attr_dev(h1, "class", "title mb-4");
    			add_location(h1, file, 36, 4, 603);
    			attr_dev(a0, "class", "btn btn-primary");
    			set_style(a0, "margin-left", "20px");
    			set_style(a0, "margin-bottom", "20px");
    			add_location(a0, file, 38, 8, 720);
    			attr_dev(a1, "class", "btn btn-primary");
    			set_style(a1, "margin-left", "20px");
    			set_style(a1, "margin-bottom", "20px");
    			add_location(a1, file, 39, 8, 833);
    			attr_dev(a2, "class", "btn btn-primary");
    			set_style(a2, "margin-left", "20px");
    			set_style(a2, "margin-bottom", "20px");
    			add_location(a2, file, 41, 8, 954);
    			attr_dev(th0, "scope", "col");
    			add_location(th0, file, 46, 4, 1143);
    			attr_dev(th1, "scope", "col");
    			add_location(th1, file, 47, 4, 1171);
    			attr_dev(th2, "scope", "col");
    			add_location(th2, file, 48, 4, 1203);
    			attr_dev(th3, "scope", "col");
    			add_location(th3, file, 49, 4, 1234);
    			attr_dev(th4, "scope", "col");
    			add_location(th4, file, 50, 4, 1266);
    			attr_dev(th5, "scope", "col");
    			add_location(th5, file, 51, 4, 1297);
    			attr_dev(th6, "scope", "col");
    			add_location(th6, file, 52, 4, 1336);
    			attr_dev(th7, "scope", "col");
    			add_location(th7, file, 53, 4, 1374);
    			attr_dev(th8, "scope", "col");
    			add_location(th8, file, 54, 4, 1407);
    			add_location(tr, file, 45, 5, 1133);
    			add_location(thead, file, 44, 3, 1119);
    			add_location(tbody, file, 58, 3, 1468);
    			attr_dev(table, "class", "table table-bordered");
    			add_location(table, file, 43, 2, 1078);
    			attr_dev(div0, "class", "container");
    			add_location(div0, file, 35, 1, 574);
    			attr_dev(div1, "class", "wrapper svelte-q1ab8a");
    			add_location(div1, file, 34, 0, 550);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t1);
    			append_dev(div0, a0);
    			append_dev(div0, t3);
    			append_dev(div0, a1);
    			append_dev(div0, t5);
    			append_dev(div0, a2);
    			append_dev(div0, t7);
    			append_dev(div0, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t9);
    			append_dev(tr, th1);
    			append_dev(tr, t11);
    			append_dev(tr, th2);
    			append_dev(tr, t13);
    			append_dev(tr, th3);
    			append_dev(tr, t15);
    			append_dev(tr, th4);
    			append_dev(tr, t17);
    			append_dev(tr, th5);
    			append_dev(tr, t19);
    			append_dev(tr, th6);
    			append_dev(tr, t21);
    			append_dev(tr, th7);
    			append_dev(tr, t23);
    			append_dev(tr, th8);
    			append_dev(table, t25);
    			append_dev(table, tbody);
    			if (if_block) if_block.m(tbody, null);

    			dispose = [
    				action_destroyer(link_action = link.call(null, a0, "/login")),
    				action_destroyer(link_action_1 = link.call(null, a1, "/register")),
    				action_destroyer(link_action_2 = link.call(null, a2, "/create"))
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*emp_list*/ ctx[0] && /*emp_list*/ ctx[0].length > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(tbody, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let emp_list = [];

    	const unsub = employees.subscribe(value => {
    		$$invalidate(0, emp_list = value);
    	});

    	function deleteEmp(id) {
    		$$invalidate(0, emp_list = emp_list.filter(entry => entry.id !== Number(id)));
    		UpdateEmployees(emp_list);
    	}

    	console.log(emp_list);

    	$$self.$capture_state = () => ({
    		link,
    		employees,
    		UpdateEmployees,
    		emp_list,
    		unsub,
    		deleteEmp,
    		Number,
    		console
    	});

    	$$self.$inject_state = $$props => {
    		if ("emp_list" in $$props) $$invalidate(0, emp_list = $$props.emp_list);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [emp_list, deleteEmp];
    }

    class Main extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Main",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\routes\Update.svelte generated by Svelte v3.19.1 */
    const file$1 = "src\\routes\\Update.svelte";

    function create_fragment$2(ctx) {
    	let div10;
    	let div9;
    	let a;
    	let link_action;
    	let t1;
    	let h1;
    	let t3;
    	let form;
    	let div3;
    	let div2;
    	let div0;
    	let input0;
    	let t4;
    	let div1;
    	let input1;
    	let t5;
    	let div5;
    	let label0;
    	let t7;
    	let input2;
    	let t8;
    	let div4;
    	let t10;
    	let div6;
    	let label1;
    	let t12;
    	let input3;
    	let t13;
    	let div7;
    	let label2;
    	let t15;
    	let input4;
    	let t16;
    	let div8;
    	let label3;
    	let t18;
    	let input5;
    	let t19;
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			div10 = element("div");
    			div9 = element("div");
    			a = element("a");
    			a.textContent = "Go Back";
    			t1 = space();
    			h1 = element("h1");
    			h1.textContent = "Update Employee:";
    			t3 = space();
    			form = element("form");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			input0 = element("input");
    			t4 = space();
    			div1 = element("div");
    			input1 = element("input");
    			t5 = space();
    			div5 = element("div");
    			label0 = element("label");
    			label0.textContent = "Email address";
    			t7 = space();
    			input2 = element("input");
    			t8 = space();
    			div4 = element("div");
    			div4.textContent = "We'll never share your email with anyone else.";
    			t10 = space();
    			div6 = element("div");
    			label1 = element("label");
    			label1.textContent = "Rank";
    			t12 = space();
    			input3 = element("input");
    			t13 = space();
    			div7 = element("div");
    			label2 = element("label");
    			label2.textContent = "Work Started";
    			t15 = space();
    			input4 = element("input");
    			t16 = space();
    			div8 = element("div");
    			label3 = element("label");
    			label3.textContent = "Shift Hours";
    			t18 = space();
    			input5 = element("input");
    			t19 = space();
    			button = element("button");
    			button.textContent = "Update";
    			attr_dev(a, "class", "btn btn-primary");
    			set_style(a, "margin-bottom", "20px");
    			set_style(a, "margin-top", "200px");
    			add_location(a, file$1, 34, 4, 600);
    			attr_dev(h1, "class", "title mb-4");
    			add_location(h1, file$1, 35, 8, 709);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "placeholder", "First name");
    			attr_dev(input0, "aria-label", "First name");
    			add_location(input0, file$1, 47, 22, 1058);
    			attr_dev(div0, "class", "col");
    			add_location(div0, file$1, 46, 20, 1017);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "placeholder", "Last name");
    			attr_dev(input1, "aria-label", "Last name");
    			add_location(input1, file$1, 50, 22, 1271);
    			attr_dev(div1, "class", "col");
    			add_location(div1, file$1, 49, 20, 1230);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$1, 45, 16, 978);
    			attr_dev(div3, "class", "mb-3");
    			add_location(div3, file$1, 44, 12, 942);
    			attr_dev(label0, "class", "form-label");
    			add_location(label0, file$1, 56, 14, 1514);
    			attr_dev(input2, "type", "email");
    			attr_dev(input2, "class", "form-control");
    			attr_dev(input2, "id", "exampleInputEmail1");
    			attr_dev(input2, "aria-describedby", "emailHelp");
    			add_location(input2, file$1, 57, 14, 1577);
    			attr_dev(div4, "id", "emailHelp");
    			attr_dev(div4, "class", "form-text");
    			add_location(div4, file$1, 58, 14, 1715);
    			attr_dev(div5, "class", "mb-3");
    			add_location(div5, file$1, 55, 12, 1480);
    			attr_dev(label1, "class", "form-label");
    			add_location(label1, file$1, 62, 14, 1875);
    			attr_dev(input3, "class", "form-control");
    			add_location(input3, file$1, 63, 14, 1929);
    			attr_dev(div6, "class", "mb-3");
    			add_location(div6, file$1, 61, 12, 1841);
    			attr_dev(label2, "class", "form-label");
    			add_location(label2, file$1, 67, 14, 2054);
    			attr_dev(input4, "type", "date");
    			attr_dev(input4, "class", "form-control");
    			add_location(input4, file$1, 68, 14, 2116);
    			attr_dev(div7, "class", "mb-3");
    			add_location(div7, file$1, 66, 12, 2020);
    			attr_dev(label3, "class", "form-label");
    			add_location(label3, file$1, 72, 14, 2261);
    			attr_dev(input5, "type", "text");
    			attr_dev(input5, "class", "form-control");
    			add_location(input5, file$1, 73, 14, 2323);
    			attr_dev(div8, "class", "mb-3");
    			add_location(div8, file$1, 71, 12, 2227);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-primary");
    			add_location(button, file$1, 77, 12, 2459);
    			add_location(form, file$1, 43, 8, 882);
    			attr_dev(div9, "class", "container");
    			add_location(div9, file$1, 32, 1, 569);
    			attr_dev(div10, "class", "wrapper svelte-1i4b59y");
    			add_location(div10, file$1, 31, 0, 545);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div9);
    			append_dev(div9, a);
    			append_dev(div9, t1);
    			append_dev(div9, h1);
    			append_dev(div9, t3);
    			append_dev(div9, form);
    			append_dev(form, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, input0);
    			set_input_value(input0, /*employee*/ ctx[0].first_name);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, input1);
    			set_input_value(input1, /*employee*/ ctx[0].last_name);
    			append_dev(form, t5);
    			append_dev(form, div5);
    			append_dev(div5, label0);
    			append_dev(div5, t7);
    			append_dev(div5, input2);
    			set_input_value(input2, /*employee*/ ctx[0].email);
    			append_dev(div5, t8);
    			append_dev(div5, div4);
    			append_dev(form, t10);
    			append_dev(form, div6);
    			append_dev(div6, label1);
    			append_dev(div6, t12);
    			append_dev(div6, input3);
    			set_input_value(input3, /*employee*/ ctx[0].rank);
    			append_dev(form, t13);
    			append_dev(form, div7);
    			append_dev(div7, label2);
    			append_dev(div7, t15);
    			append_dev(div7, input4);
    			set_input_value(input4, /*employee*/ ctx[0].work_started);
    			append_dev(form, t16);
    			append_dev(form, div8);
    			append_dev(div8, label3);
    			append_dev(div8, t18);
    			append_dev(div8, input5);
    			set_input_value(input5, /*employee*/ ctx[0].shift_hours);
    			append_dev(form, t19);
    			append_dev(form, button);

    			dispose = [
    				action_destroyer(link_action = link.call(null, a, "/")),
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[6]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[7]),
    				listen_dev(input2, "input", /*input2_input_handler*/ ctx[8]),
    				listen_dev(input3, "input", /*input3_input_handler*/ ctx[9]),
    				listen_dev(input4, "input", /*input4_input_handler*/ ctx[10]),
    				listen_dev(input5, "input", /*input5_input_handler*/ ctx[11]),
    				listen_dev(form, "submit", prevent_default(/*handleSubmit*/ ctx[1]), false, true, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*employee*/ 1 && input0.value !== /*employee*/ ctx[0].first_name) {
    				set_input_value(input0, /*employee*/ ctx[0].first_name);
    			}

    			if (dirty & /*employee*/ 1 && input1.value !== /*employee*/ ctx[0].last_name) {
    				set_input_value(input1, /*employee*/ ctx[0].last_name);
    			}

    			if (dirty & /*employee*/ 1 && input2.value !== /*employee*/ ctx[0].email) {
    				set_input_value(input2, /*employee*/ ctx[0].email);
    			}

    			if (dirty & /*employee*/ 1 && input3.value !== /*employee*/ ctx[0].rank) {
    				set_input_value(input3, /*employee*/ ctx[0].rank);
    			}

    			if (dirty & /*employee*/ 1) {
    				set_input_value(input4, /*employee*/ ctx[0].work_started);
    			}

    			if (dirty & /*employee*/ 1 && input5.value !== /*employee*/ ctx[0].shift_hours) {
    				set_input_value(input5, /*employee*/ ctx[0].shift_hours);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div10);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { params = {} } = $$props;
    	let emp_list = [];

    	const unsub = employees.subscribe(value => {
    		emp_list = value;
    	});

    	const id = params.id;
    	const employee = emp_list.find(i => i.id === Number(id));

    	function handleSubmit() {
    		UpdateEmployees(emp_list);
    	}

    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Update> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		employee.first_name = this.value;
    		$$invalidate(0, employee);
    	}

    	function input1_input_handler() {
    		employee.last_name = this.value;
    		$$invalidate(0, employee);
    	}

    	function input2_input_handler() {
    		employee.email = this.value;
    		$$invalidate(0, employee);
    	}

    	function input3_input_handler() {
    		employee.rank = this.value;
    		$$invalidate(0, employee);
    	}

    	function input4_input_handler() {
    		employee.work_started = this.value;
    		$$invalidate(0, employee);
    	}

    	function input5_input_handler() {
    		employee.shift_hours = this.value;
    		$$invalidate(0, employee);
    	}

    	$$self.$set = $$props => {
    		if ("params" in $$props) $$invalidate(2, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		params,
    		link,
    		employees,
    		UpdateEmployees,
    		emp_list,
    		unsub,
    		id,
    		employee,
    		handleSubmit,
    		Number
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(2, params = $$props.params);
    		if ("emp_list" in $$props) emp_list = $$props.emp_list;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		employee,
    		handleSubmit,
    		params,
    		emp_list,
    		unsub,
    		id,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler,
    		input5_input_handler
    	];
    }

    class Update extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { params: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Update",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get params() {
    		throw new Error("<Update>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Update>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\routes\Create.svelte generated by Svelte v3.19.1 */
    const file$2 = "src\\routes\\Create.svelte";

    function create_fragment$3(ctx) {
    	let div10;
    	let div9;
    	let a;
    	let link_action;
    	let t1;
    	let h1;
    	let t3;
    	let form;
    	let div3;
    	let div2;
    	let div0;
    	let input0;
    	let t4;
    	let div1;
    	let input1;
    	let t5;
    	let div5;
    	let label0;
    	let t7;
    	let input2;
    	let t8;
    	let div4;
    	let t10;
    	let div6;
    	let label1;
    	let t12;
    	let input3;
    	let t13;
    	let div7;
    	let label2;
    	let t15;
    	let input4;
    	let t16;
    	let div8;
    	let label3;
    	let t18;
    	let input5;
    	let t19;
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			div10 = element("div");
    			div9 = element("div");
    			a = element("a");
    			a.textContent = "Go Back";
    			t1 = space();
    			h1 = element("h1");
    			h1.textContent = "Create New Employee";
    			t3 = space();
    			form = element("form");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			input0 = element("input");
    			t4 = space();
    			div1 = element("div");
    			input1 = element("input");
    			t5 = space();
    			div5 = element("div");
    			label0 = element("label");
    			label0.textContent = "Email address";
    			t7 = space();
    			input2 = element("input");
    			t8 = space();
    			div4 = element("div");
    			div4.textContent = "We'll never share your email with anyone else.";
    			t10 = space();
    			div6 = element("div");
    			label1 = element("label");
    			label1.textContent = "Rank";
    			t12 = space();
    			input3 = element("input");
    			t13 = space();
    			div7 = element("div");
    			label2 = element("label");
    			label2.textContent = "Work Started";
    			t15 = space();
    			input4 = element("input");
    			t16 = space();
    			div8 = element("div");
    			label3 = element("label");
    			label3.textContent = "Shift Hours";
    			t18 = space();
    			input5 = element("input");
    			t19 = space();
    			button = element("button");
    			button.textContent = "Submit";
    			attr_dev(a, "class", "btn btn-primary");
    			set_style(a, "margin-bottom", "20px");
    			set_style(a, "margin-top", "200px");
    			add_location(a, file$2, 47, 4, 804);
    			attr_dev(h1, "class", "title mb-4");
    			add_location(h1, file$2, 48, 8, 913);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "placeholder", "First name");
    			attr_dev(input0, "aria-label", "First name");
    			add_location(input0, file$2, 54, 22, 1156);
    			attr_dev(div0, "class", "col");
    			add_location(div0, file$2, 53, 20, 1115);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "placeholder", "Last name");
    			attr_dev(input1, "aria-label", "Last name");
    			add_location(input1, file$2, 57, 22, 1369);
    			attr_dev(div1, "class", "col");
    			add_location(div1, file$2, 56, 20, 1328);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$2, 52, 16, 1076);
    			attr_dev(div3, "class", "mb-3");
    			add_location(div3, file$2, 51, 12, 1040);
    			attr_dev(label0, "class", "form-label");
    			add_location(label0, file$2, 63, 14, 1612);
    			attr_dev(input2, "type", "email");
    			attr_dev(input2, "class", "form-control");
    			attr_dev(input2, "id", "exampleInputEmail1");
    			attr_dev(input2, "aria-describedby", "emailHelp");
    			add_location(input2, file$2, 64, 14, 1675);
    			attr_dev(div4, "id", "emailHelp");
    			attr_dev(div4, "class", "form-text");
    			add_location(div4, file$2, 65, 14, 1813);
    			attr_dev(div5, "class", "mb-3");
    			add_location(div5, file$2, 62, 12, 1578);
    			attr_dev(label1, "class", "form-label");
    			add_location(label1, file$2, 69, 14, 1973);
    			attr_dev(input3, "class", "form-control");
    			add_location(input3, file$2, 70, 14, 2027);
    			attr_dev(div6, "class", "mb-3");
    			add_location(div6, file$2, 68, 12, 1939);
    			attr_dev(label2, "class", "form-label");
    			add_location(label2, file$2, 74, 14, 2152);
    			attr_dev(input4, "type", "date");
    			attr_dev(input4, "class", "form-control");
    			add_location(input4, file$2, 75, 14, 2214);
    			attr_dev(div7, "class", "mb-3");
    			add_location(div7, file$2, 73, 12, 2118);
    			attr_dev(label3, "class", "form-label");
    			add_location(label3, file$2, 79, 14, 2359);
    			attr_dev(input5, "type", "text");
    			attr_dev(input5, "class", "form-control");
    			add_location(input5, file$2, 80, 14, 2421);
    			attr_dev(div8, "class", "mb-3");
    			add_location(div8, file$2, 78, 12, 2325);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-primary");
    			add_location(button, file$2, 84, 12, 2557);
    			add_location(form, file$2, 50, 8, 980);
    			attr_dev(div9, "class", "container");
    			add_location(div9, file$2, 45, 1, 773);
    			attr_dev(div10, "class", "wrapper svelte-1i4b59y");
    			add_location(div10, file$2, 44, 0, 749);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div9);
    			append_dev(div9, a);
    			append_dev(div9, t1);
    			append_dev(div9, h1);
    			append_dev(div9, t3);
    			append_dev(div9, form);
    			append_dev(form, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, input0);
    			set_input_value(input0, /*employee*/ ctx[0].first_name);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, input1);
    			set_input_value(input1, /*employee*/ ctx[0].last_name);
    			append_dev(form, t5);
    			append_dev(form, div5);
    			append_dev(div5, label0);
    			append_dev(div5, t7);
    			append_dev(div5, input2);
    			set_input_value(input2, /*employee*/ ctx[0].email);
    			append_dev(div5, t8);
    			append_dev(div5, div4);
    			append_dev(form, t10);
    			append_dev(form, div6);
    			append_dev(div6, label1);
    			append_dev(div6, t12);
    			append_dev(div6, input3);
    			set_input_value(input3, /*employee*/ ctx[0].rank);
    			append_dev(form, t13);
    			append_dev(form, div7);
    			append_dev(div7, label2);
    			append_dev(div7, t15);
    			append_dev(div7, input4);
    			set_input_value(input4, /*employee*/ ctx[0].work_started);
    			append_dev(form, t16);
    			append_dev(form, div8);
    			append_dev(div8, label3);
    			append_dev(div8, t18);
    			append_dev(div8, input5);
    			set_input_value(input5, /*employee*/ ctx[0].shift_hours);
    			append_dev(form, t19);
    			append_dev(form, button);

    			dispose = [
    				action_destroyer(link_action = link.call(null, a, "/")),
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[4]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[5]),
    				listen_dev(input2, "input", /*input2_input_handler*/ ctx[6]),
    				listen_dev(input3, "input", /*input3_input_handler*/ ctx[7]),
    				listen_dev(input4, "input", /*input4_input_handler*/ ctx[8]),
    				listen_dev(input5, "input", /*input5_input_handler*/ ctx[9]),
    				listen_dev(form, "submit", prevent_default(/*handleSubmit*/ ctx[1]), false, true, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*employee*/ 1 && input0.value !== /*employee*/ ctx[0].first_name) {
    				set_input_value(input0, /*employee*/ ctx[0].first_name);
    			}

    			if (dirty & /*employee*/ 1 && input1.value !== /*employee*/ ctx[0].last_name) {
    				set_input_value(input1, /*employee*/ ctx[0].last_name);
    			}

    			if (dirty & /*employee*/ 1 && input2.value !== /*employee*/ ctx[0].email) {
    				set_input_value(input2, /*employee*/ ctx[0].email);
    			}

    			if (dirty & /*employee*/ 1 && input3.value !== /*employee*/ ctx[0].rank) {
    				set_input_value(input3, /*employee*/ ctx[0].rank);
    			}

    			if (dirty & /*employee*/ 1) {
    				set_input_value(input4, /*employee*/ ctx[0].work_started);
    			}

    			if (dirty & /*employee*/ 1 && input5.value !== /*employee*/ ctx[0].shift_hours) {
    				set_input_value(input5, /*employee*/ ctx[0].shift_hours);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div10);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let emp_list = [];

    	const unsub = employees.subscribe(value => {
    		emp_list = value;
    	});

    	let employee = {
    		first_name: "",
    		last_name: "",
    		email: "",
    		rank: "",
    		work_started: "",
    		shift_hours: ""
    	};

    	function handleSubmit() {
    		const entry = { id: emp_list.length + 1, ...employee };
    		emp_list.push(entry);
    		UpdateEmployees(emp_list);
    		return;
    	}

    	function input0_input_handler() {
    		employee.first_name = this.value;
    		$$invalidate(0, employee);
    	}

    	function input1_input_handler() {
    		employee.last_name = this.value;
    		$$invalidate(0, employee);
    	}

    	function input2_input_handler() {
    		employee.email = this.value;
    		$$invalidate(0, employee);
    	}

    	function input3_input_handler() {
    		employee.rank = this.value;
    		$$invalidate(0, employee);
    	}

    	function input4_input_handler() {
    		employee.work_started = this.value;
    		$$invalidate(0, employee);
    	}

    	function input5_input_handler() {
    		employee.shift_hours = this.value;
    		$$invalidate(0, employee);
    	}

    	$$self.$capture_state = () => ({
    		link,
    		employees,
    		UpdateEmployees,
    		emp_list,
    		unsub,
    		employee,
    		handleSubmit
    	});

    	$$self.$inject_state = $$props => {
    		if ("emp_list" in $$props) emp_list = $$props.emp_list;
    		if ("employee" in $$props) $$invalidate(0, employee = $$props.employee);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		employee,
    		handleSubmit,
    		emp_list,
    		unsub,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler,
    		input5_input_handler
    	];
    }

    class Create extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Create",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\routes\Login.svelte generated by Svelte v3.19.1 */
    const file$3 = "src\\routes\\Login.svelte";

    function create_fragment$4(ctx) {
    	let div5;
    	let div4;
    	let a;
    	let link_action;
    	let t1;
    	let div3;
    	let form;
    	let h1;
    	let t3;
    	let div0;
    	let label0;
    	let t5;
    	let input0;
    	let t6;
    	let div1;
    	let label1;
    	let t8;
    	let input1;
    	let t9;
    	let div2;
    	let label2;
    	let input2;
    	let t10;
    	let t11;
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div4 = element("div");
    			a = element("a");
    			a.textContent = "Go Back";
    			t1 = space();
    			div3 = element("div");
    			form = element("form");
    			h1 = element("h1");
    			h1.textContent = "Please Login";
    			t3 = space();
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Email address";
    			t5 = space();
    			input0 = element("input");
    			t6 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Password";
    			t8 = space();
    			input1 = element("input");
    			t9 = space();
    			div2 = element("div");
    			label2 = element("label");
    			input2 = element("input");
    			t10 = text(" Remember me");
    			t11 = space();
    			button = element("button");
    			button.textContent = "Sign in";
    			attr_dev(a, "class", "btn btn-primary");
    			set_style(a, "margin-bottom", "20px");
    			set_style(a, "margin-top", "200px");
    			add_location(a, file$3, 44, 8, 914);
    			attr_dev(h1, "class", "h3 mb-3 fw-normal");
    			add_location(h1, file$3, 48, 14, 1086);
    			attr_dev(label0, "for", "inputEmail");
    			attr_dev(label0, "class", "visually-hidden");
    			add_location(label0, file$3, 52, 16, 1189);
    			attr_dev(input0, "type", "email");
    			attr_dev(input0, "id", "inputEmail");
    			attr_dev(input0, "class", "form-control svelte-wa3tv7");
    			attr_dev(input0, "placeholder", "Email address");
    			input0.required = "";
    			input0.autofocus = "";
    			add_location(input0, file$3, 53, 16, 1276);
    			attr_dev(div0, "class", "mb-3");
    			add_location(div0, file$3, 51, 14, 1153);
    			attr_dev(label1, "for", "inputPassword");
    			attr_dev(label1, "class", "visually-hidden");
    			add_location(label1, file$3, 57, 16, 1462);
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "id", "inputPassword");
    			attr_dev(input1, "class", "form-control svelte-wa3tv7");
    			attr_dev(input1, "placeholder", "Password");
    			input1.required = "";
    			add_location(input1, file$3, 58, 16, 1547);
    			attr_dev(div1, "class", "mb-3");
    			add_location(div1, file$3, 56, 14, 1426);
    			attr_dev(input2, "type", "checkbox");
    			input2.value = "remember-me";
    			add_location(input2, file$3, 64, 18, 1759);
    			add_location(label2, file$3, 63, 16, 1732);
    			attr_dev(div2, "class", "checkbox mb-3 svelte-wa3tv7");
    			add_location(div2, file$3, 62, 14, 1687);
    			attr_dev(button, "class", "w-100 btn btn-lg btn-primary");
    			attr_dev(button, "type", "submit");
    			add_location(button, file$3, 67, 14, 1878);
    			add_location(form, file$3, 47, 12, 1064);
    			attr_dev(div3, "class", "form-signin svelte-wa3tv7");
    			add_location(div3, file$3, 46, 8, 1025);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$3, 43, 4, 881);
    			attr_dev(div5, "class", "wrapper svelte-wa3tv7");
    			add_location(div5, file$3, 42, 0, 854);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, a);
    			append_dev(div4, t1);
    			append_dev(div4, div3);
    			append_dev(div3, form);
    			append_dev(form, h1);
    			append_dev(form, t3);
    			append_dev(form, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t5);
    			append_dev(div0, input0);
    			append_dev(form, t6);
    			append_dev(form, div1);
    			append_dev(div1, label1);
    			append_dev(div1, t8);
    			append_dev(div1, input1);
    			append_dev(form, t9);
    			append_dev(form, div2);
    			append_dev(div2, label2);
    			append_dev(label2, input2);
    			append_dev(label2, t10);
    			append_dev(form, t11);
    			append_dev(form, button);
    			dispose = action_destroyer(link_action = link.call(null, a, "/"));
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	$$self.$capture_state = () => ({ link });
    	return [];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\routes\Register.svelte generated by Svelte v3.19.1 */
    const file$4 = "src\\routes\\Register.svelte";

    function create_fragment$5(ctx) {
    	let div9;
    	let div8;
    	let a;
    	let link_action;
    	let t1;
    	let div7;
    	let form;
    	let h1;
    	let t3;
    	let div3;
    	let div2;
    	let div0;
    	let input0;
    	let t4;
    	let div1;
    	let input1;
    	let t5;
    	let div4;
    	let label0;
    	let t7;
    	let input2;
    	let t8;
    	let div5;
    	let label1;
    	let t10;
    	let input3;
    	let t11;
    	let div6;
    	let label2;
    	let input4;
    	let t12;
    	let t13;
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			div9 = element("div");
    			div8 = element("div");
    			a = element("a");
    			a.textContent = "Go Back";
    			t1 = space();
    			div7 = element("div");
    			form = element("form");
    			h1 = element("h1");
    			h1.textContent = "Register Here";
    			t3 = space();
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			input0 = element("input");
    			t4 = space();
    			div1 = element("div");
    			input1 = element("input");
    			t5 = space();
    			div4 = element("div");
    			label0 = element("label");
    			label0.textContent = "Email address";
    			t7 = space();
    			input2 = element("input");
    			t8 = space();
    			div5 = element("div");
    			label1 = element("label");
    			label1.textContent = "Password";
    			t10 = space();
    			input3 = element("input");
    			t11 = space();
    			div6 = element("div");
    			label2 = element("label");
    			input4 = element("input");
    			t12 = text(" Remember me");
    			t13 = space();
    			button = element("button");
    			button.textContent = "Register User";
    			attr_dev(a, "class", "btn btn-primary");
    			set_style(a, "margin-bottom", "20px");
    			set_style(a, "margin-top", "200px");
    			add_location(a, file$4, 62, 6, 1184);
    			attr_dev(h1, "class", "h3 mb-3 fw-normal");
    			add_location(h1, file$4, 66, 14, 1396);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control svelte-wa3tv7");
    			attr_dev(input0, "placeholder", "First name");
    			attr_dev(input0, "aria-label", "First name");
    			add_location(input0, file$4, 71, 22, 1578);
    			attr_dev(div0, "class", "col");
    			add_location(div0, file$4, 70, 20, 1537);
    			attr_dev(input1, "ype", "text");
    			attr_dev(input1, "class", "form-control svelte-wa3tv7");
    			attr_dev(input1, "placeholder", "Last name");
    			attr_dev(input1, "aria-label", "Last name");
    			add_location(input1, file$4, 74, 22, 1758);
    			attr_dev(div1, "class", "col");
    			add_location(div1, file$4, 73, 20, 1717);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$4, 69, 16, 1498);
    			attr_dev(div3, "class", "mb-3");
    			add_location(div3, file$4, 68, 14, 1462);
    			attr_dev(label0, "for", "inputEmail");
    			attr_dev(label0, "class", "visually-hidden");
    			add_location(label0, file$4, 80, 16, 1986);
    			attr_dev(input2, "type", "email");
    			attr_dev(input2, "id", "inputEmail");
    			attr_dev(input2, "class", "form-control svelte-wa3tv7");
    			attr_dev(input2, "placeholder", "Email address");
    			input2.required = "";
    			input2.autofocus = "";
    			add_location(input2, file$4, 81, 16, 2073);
    			attr_dev(div4, "class", "mb-3");
    			add_location(div4, file$4, 79, 14, 1950);
    			attr_dev(label1, "for", "inputPassword");
    			attr_dev(label1, "class", "visually-hidden");
    			add_location(label1, file$4, 85, 16, 2259);
    			attr_dev(input3, "type", "password");
    			attr_dev(input3, "id", "inputPassword");
    			attr_dev(input3, "class", "form-control svelte-wa3tv7");
    			attr_dev(input3, "placeholder", "Password");
    			input3.required = "";
    			add_location(input3, file$4, 86, 16, 2344);
    			attr_dev(div5, "class", "mb-3");
    			add_location(div5, file$4, 84, 14, 2223);
    			attr_dev(input4, "type", "checkbox");
    			input4.value = "remember-me";
    			add_location(input4, file$4, 94, 18, 2574);
    			add_location(label2, file$4, 93, 16, 2547);
    			attr_dev(div6, "class", "checkbox mb-3 svelte-wa3tv7");
    			add_location(div6, file$4, 92, 14, 2502);
    			attr_dev(button, "class", "w-100 btn btn-lg btn-primary");
    			attr_dev(button, "type", "submit");
    			add_location(button, file$4, 97, 14, 2693);
    			add_location(form, file$4, 65, 12, 1334);
    			attr_dev(div7, "class", "form-signin svelte-wa3tv7");
    			add_location(div7, file$4, 64, 8, 1295);
    			attr_dev(div8, "class", "container");
    			add_location(div8, file$4, 61, 4, 1153);
    			attr_dev(div9, "class", "wrapper svelte-wa3tv7");
    			add_location(div9, file$4, 60, 0, 1126);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div9, anchor);
    			append_dev(div9, div8);
    			append_dev(div8, a);
    			append_dev(div8, t1);
    			append_dev(div8, div7);
    			append_dev(div7, form);
    			append_dev(form, h1);
    			append_dev(form, t3);
    			append_dev(form, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, input0);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, input1);
    			append_dev(form, t5);
    			append_dev(form, div4);
    			append_dev(div4, label0);
    			append_dev(div4, t7);
    			append_dev(div4, input2);
    			append_dev(form, t8);
    			append_dev(form, div5);
    			append_dev(div5, label1);
    			append_dev(div5, t10);
    			append_dev(div5, input3);
    			append_dev(form, t11);
    			append_dev(form, div6);
    			append_dev(div6, label2);
    			append_dev(label2, input4);
    			append_dev(label2, t12);
    			append_dev(form, t13);
    			append_dev(form, button);

    			dispose = [
    				action_destroyer(link_action = link.call(null, a, "/")),
    				listen_dev(form, "submit", prevent_default(/*handleSubmit*/ ctx[0]), false, true, false)
    			];
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div9);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let user_list = [];

    	function handleSubmit() {
    		const unsub = Admin.subscribe(value => {
    			user_list = value;
    		});

    		const entry = { id: user_list.length + 1, ...user };
    		user_list.push(entry);
    		Administrator(user_list);
    	}

    	$$self.$capture_state = () => ({
    		link,
    		user_list,
    		handleSubmit,
    		Admin,
    		user,
    		Administrator
    	});

    	$$self.$inject_state = $$props => {
    		if ("user_list" in $$props) user_list = $$props.user_list;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [handleSubmit];
    }

    class Register extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Register",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    var routes = {
        '/': Main,

        '/login': Login,
        '/register': Register,
        
        '/create': Create,
        '/update/:id': Update
    };

    /* src\App.svelte generated by Svelte v3.19.1 */

    function create_fragment$6(ctx) {
    	let current;
    	const router = new Router({ props: { routes }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	$$self.$capture_state = () => ({ Router, routes });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
