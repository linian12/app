//从头读到尾，所有函数都注册之后再执行代码
;(function () {//结束之前引入的某一库的东西

	'use-script';
	//console.log('$',$);
	var $form_add_task = $('.add-task')
		,$window =$(window)
		,$body = $('body')
		,$delete_task 
		,$detail_task
		,$task_detail = $('.task-detail')
		,$task_detail_mask =　$('.task-detail-mask')
		, new_task = {}
		,task_list={}
		,current_index
		,$update_form
		,$task_detail_content
		,$task_detail_content_input
		,$checkbox_complete
		,$msg = $('.msg')
		,$msg_content = $msg.find('.msg-content')
		,$msg_confirm = $msg.find('.confirmed')
		,$alerter = $('.alerter')
		;

	
	init();

	$form_add_task.on('submit',on_add_task_form_submit)
	$task_detail_mask.on('click',hide_task_detail)
	function pop(arg) {//弹出层
		if(!arg){
			console.error('pop title is required');
		}
		var conf = {}
			,$box
			,$mask
			,$title
			,$content
			,$confirm
			,$cancel
			,timer
			,dfd
			,confirmed
			;
		dfd = $.Deferred();//用于返回一个deferred对象
		if(typeof arg == 'string')
			conf.title = arg;
		else{
			conf = $.extend(conf,arg);

		}

		$box = $('<div>' + 
			'<div class="pop-title">' + conf.title + '</div>' +
			'<div class="pop-content">' +
			'<div>' +
			'<button style="margin-right: 5px;" class="primary confirm">确定</button>' + 
			'<button class="cancel">取消</button>' +
			'</div>' +
			'</div>' +
			'</div>')
			.css({
				color: '#444',	
				width: 300,
				height:'auto',
				padding:'15px 10px',
				background: '#fff',
				position: 'fixed',
				'border-radius': 3,
				'box-shadow' : '0 1px 2px rgba(0,0,0,.5)'
			});
		$title = $box.find('.pop-title').css({
      		padding: '5px 10px',
      		'font-weight': 900,
      		'font-size': 20,
      		'text-align': 'center'
    	});

    	$content = $box.find('.pop-content').css({
     		padding: '5px 10px',
      		'text-align': 'center'
    	});

    	$confirm = $content.find('button.confirm');
    	$cancel = $content.find('button.cancel');

    	$mask = $('<div></div>')
      		.css({
        	position: 'fixed',
        	background: 'rgba(0,0,0,.5)',
        	top: 0,
        	bottom: 0,
        	left: 0,
        	right: 0,
      	})
      	timer = setInterval(function () {
      		if (confirmed !== undefined) {//用户点击了
        		dfd.resolve(confirmed);//手动改变deferred对象的运行状态为已完成
        		clearInterval(timer);
       			dismiss_pop();
      		}
    	}, 50);//关于用户什么时候点击，所以要一直轮询这个状态，看用户到底点击没有
		$confirm.on('click', on_confirmed);
    	$cancel.on('click', on_cancel);
    	$mask.on('click', on_cancel);

   		function on_cancel() {
     		confirmed = false;
    	}

    	function on_confirmed() {
      		confirmed = true;
    	}
    	function dismiss_pop() {
      		$mask.remove();
     		$box.remove();
    	}
    	function adjust_box_position() {
    		var window_width = $window.width()
    			,window_height = $window.height()
    			,box_width = $box.width()
    			,box_height = $box.height()
    			,move_x
    			,move_y
    			;
    		move_x = (window_width - box_width)/2
    		move_y = (window_height - box_height)/2 -20;
    		$box.css({
    			left: move_x,
    			top: move_y
    		})
    	}
    	$window.on('resize',function () {//当用户缩放窗口会触发事件resize
    		adjust_box_position();
    	})
    	$mask.appendTo($body);
    	$box.appendTo($body);
    	$window.resize();
    	return  dfd.promise();//没有参数时，返回一个新的deferred对象，该对象运行状态无法改变

		
	}
	function listen_msg_event() {
		$msg_confirm.on('click', function () {
      		hide_msg();
    	})
	}
	function on_add_task_form_submit (e) {
		new_task = {};
		// 禁用默认行为
		e.preventDefault();
		//获取新task值
		var $input = $(this).find('input[name=content]');
		new_task.content = $input.val();
		//如果新Task的值为空，则直接返回，否则继续
		if (!new_task.content) return;
		if(add_task(new_task)) {
			render_task_list();
			$input.val(null);

		}
	}
	//查找并监听所有按钮的的点击事件
	function listen_task_delete() {

		$delete_task.on('click', function (){
			var $this = $(this);
			//找到删除按钮所在的task元素
			var $item = $this.parent().parent();
			var index = $item.data('index');
			//确认删除
			// var tmp = confirm('确定删除？');

			// tmp ? delete_task(index) : null;
			pop('确定删除？')
				.then(function (r) {//r为resolve里的参数
					r ? delete_task(index) : null;
				})

		})
	}
	function listen_task_detail () {
		$detail_task.on('click',function () {
			var $this = $(this);
			var $item = $this.parent().parent();
			var index = $item.data('index');
			show_task_detail(index);
		})
	}
	function listen_checkbox_complete() {
		$checkbox_complete.on('click',function () {
			//var is_complete = $(this).is(':checked');
			var index = $(this).parent().parent().data('index');
		var item = get(index);
			if (item.complete)
        		update_task(index, {complete: false});
      		else
        		update_task(index, {complete: true});
        	//console.log(1);
			
		})
	}
	function get(index) {
		return  store.get('task_list')[index];
	}
	//查看task详情
	function show_task_detail(index) {
		render_task_detail(index);
		current_index = index;
		$task_detail.show();
		$task_detail_mask.show();
	}
	function update_task(index,data) {
		if(index === undefined || !task_list[index])
			return;
		task_list[index] = $.extend({},task_list[index],data);//合并前面和后面的对象
		refresh_task_list();
	}
	
	function hide_task_detail(index) {
		$task_detail.hide();
		$task_detail_mask.hide();
	}
	// 渲染指定task的详细信息
	function render_task_detail(index){
		if(index === undefined || !task_list[index])
			return;
		var item = task_list[index];
		//console.log(item);
		var tpl = '<form>' +
			'<div class="content">' + 
			item.content + 
			'</div>' +
			'<div class="input-item">' +
			'<input style="display: none;" type="text" name="content" value="' + (item.content || '') + '">' +
			'</div>' +
			'<div>' + 
			'<div class="desc input-item">' +
			'<textarea name="desc">' + (item.desc || '') + '</textarea>' +
			'</div>' +
			
			'<div class="remind input-item">' + 
			'<label>提醒时间</label>' + 
			'<input class="datetime" type="text" name="remind_date" value="' +(item.remind_date || '') + '">' +
			'</div>' +
			'<div class="input-item"><button type="submit">更新</button></div>' +
			'</form>';
		$task_detail.html(null);
		$task_detail.html(tpl);
		$('.datetime').datetimepicker();
		$update_form = $task_detail.find('form');
		$task_detail_content = $update_form.find('.content');
		$task_detail_content_input = $update_form.find('[name=content]');
		$task_detail_content.on('dblclick',function(){
			$task_detail_content_input.show();
			$task_detail_content.hide();

		})
		$update_form.on('submit', function (e) {
			e.preventDefault();
			var data = {};
			data.content = $(this).find('[name = content]').val();
			data.desc = $(this).find('[name = desc]').val();
			data.remind_date = $(this).find('[name = remind_date]').val();
			//console.log(data);
			//console.log(task_list);
			update_task(index,data);
			hide_task_detail();
		})


	}
	//刷新localstorage数据,并渲染模板tpl
	function refresh_task_list() {
		//更新localstorage
		store.set('task_list',task_list);
		render_task_list();
	}
	//删除一条task
	function delete_task(index) {
		// 如果没有index或者index不存在直接返回
		if(index === undefined || !task_list[index]) return;
		delete task_list[index];
		refresh_task_list();
	}
	//添加task
	function add_task(new_task){
		//new_task = {content:'a'};
		//将新task推入task_list
		task_list.push(new_task);
		//task_list.push(new_task);
		//更新localstorage
		store.set('task_list',task_list);
		
		return true;
		
	}
	function init() {
		
		task_list = store.get('task_list') || [];
		listen_msg_event();
		if (task_list.length) 
			render_task_list();
		task_remind_check();
		//console.log(store.get('task_list'));
	}
	function task_remind_check() {
		var current_timestamp;
		
		var itl = setInterval(function () {
			for(var i=0; i<task_list.length;i++){
				var item = get(i),task_timestamp;

				if(!item || !item.remind_date || item.informed) 
					continue;
				current_timestamp = (new Date()).getTime();
				task_timestamp = (new Date(item.remind_date)).getTime();
				//console.log(current_timestamp,task_timestamp);
				if(current_timestamp - task_timestamp >= 1){
					update_task(i, {informed: true});
					show_msg(item.content);

				}
				
			}
		},300);
	}
	function show_msg(msg) {
		if(!msg) return;
		$msg_content.html(msg);
		$alerter.get(0).play();
		$msg.show();
	}
	function hide_msg() {
		$msg.hide();
	}
	// 渲染所有task模板
	function render_task_list() {
		var $task_list = $('.task-list');
		$task_list.html('');
		var i=0;
		var complete_items = [];
		for(i=0; i<task_list.length;i++) {
			var item = task_list[i];
			if(item && item.complete)
				complete_items[i] = item;
			else
				var $task = render_task_item(item,i);
			$task_list.prepend($task);
		}
	 	for (var j = 0; j < complete_items.length; j++) {
     		$task = render_task_item(complete_items[j], j);
      		if (!$task) continue;
      		$task.addClass('completed');
      		$task_list.append($task);
    	}

		$delete_task = $('.action.delete');
		$detail_task = $('.action.detail');
		$checkbox_complete = $('.task-list .complete[type=checkbox]');
		listen_task_delete();
		listen_task_detail();
		listen_checkbox_complete();
	}
	//渲染单条task模板
	function render_task_item(data,index) {
		if(!data || index ===undefined) return;
		var list_item_tpl = 
			'<div class="task-item" data-index="' + index + '">' + 
			'<span><input type="checkbox"' + (data.complete ? 'checked' : '') + ' class="complete"></span>' + 
			'<span class="task-content">' + data.content + '</span>' + 
			'<span class="fr">' +
			'<span class="action delete"> 删除</span>' + 
			'<span class="action detail"> 详细</span>' + 
			'</span>' +
			'</div>';

		return $(list_item_tpl);
	}


})();//匿名fun，定义瞬间触发
//var a=1;在window下对环境有污染