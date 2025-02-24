const hyprland = await Service.import("hyprland")
const player = await Service.import("mpris")
const audio = await Service.import("audio")
const battery = await Service.import("battery")
const systemtray = await Service.import("systemtray")
const network = await Service.import('network')
const time = Variable("", {
    poll: [1000, 'date "+%I:%M %p "'],
})
const notificationVal = Variable("",{
    poll: [3000,'swaync-client -c']
})
var date = Variable("", {
    poll: [1000, 'date "+%d %B %A"'],
})
var time24 = Variable("", {
    poll: [1000, 'date "+%H:%M"'],
})
var cpu = Variable("", {
    poll: [2000, `/home/<username>/.config/ags/checkCPU.sh | sed 's/\\//g'`],
})
const username =  Utils.exec(`whoami`)
const imageLink = Utils.exec('ls /var/lib/AccountsService/icons/'+username)

/** @param {import('types/service/systemtray').TrayItem} item */
const SysTrayItem = item => Widget.Button({
    child: Widget.Icon().bind('icon', item, 'icon'),
    tooltipMarkup: item.bind('tooltip_markup'),
    class_name:"trayIcon",
    onPrimaryClick: (_, event) => item.activate(event),
    onSecondaryClick: (_, event) => item.openMenu(event),
});

const Clock = Widget.Box({
    name:"clock", 
    class_name:"clock",
    hpack:"start",
    vertical:false,
    children:[
        Widget.Label({
            class_name:"day",
            hpack:"start",
            label:time.bind(),
            tooltip_text:date.bind(),
        }),
    ]
})

const focusedTitle = Widget.Label().hook(hyprland,self =>{
    self.label = hyprland.active.client.bind('address').emitter.title ==""?"   Home     ":(`   ${hyprland.active.client.bind('title').emitter.title.slice(0, 30) + (hyprland.active.client.bind('title').emitter.title.length > 30 ? '...' : ' ')}`);
    self.class_name="title"
})

const dispatch = ws => hyprland.messageAsync(`dispatch workspace ${ws}`);

const Workspaces = () => Widget.EventBox({
    onScrollUp: () => dispatch('+1'),
    onScrollDown: () => dispatch('-1'),
    child: Widget.Box({
        class_name:"workspace",
        hpack:"start",
        children: Array.from({ length: 9 }, (_, i) => i + 1).map(i => Widget.Label({
            attribute: i,
            class_name:"workspaceBTN",
            label: `${i}`,
        }).hook(hyprland,self=>{
            self.class_name = i ==hyprland.active.workspace.id ? "workspaceBTNFocused":`workspaceBTN`
        })),
        setup: self => self.hook(hyprland, () => self.children.forEach(btn => {
            btn.visible = hyprland.workspaces.some(ws => ws.id === btn.attribute);
        })),
    }),
})

const BasicInfo = () => Widget.Box({
    hpack:"end",
    children :[ 
        Widget.Box({
            class_name:"AdvancedInfo",
            hpack:"end",
            children:[
                Widget.Box({
                    children:[ 
                        Widget.Label({
                            justification: 'left',
                            class_name:"SYS",
                            visible: true,
                            label:cpu.bind()
                        })
                    ]
                }),
            ]
        }),
        Widget.Box({
            hpack:"end",
            class_name:"BasicInfo",
            children: [
                Widget.Icon().hook(network.wifi,self =>{
                    self.icon = network.wifi.iconName,
                    self.class_name= "WifiIcon"
                    self.tooltip_text = (network.wifi.ssid) ? network.wifi.ssid:'Not Connected'
                }),
                Widget.Icon().hook(audio.speaker, self => {
                    const vol = audio.speaker.volume * 100;
                    const icon = [
                        [101, 'overamplified'],
                        [67, 'high'],
                        [34, 'medium'],
                        [1, 'low'],
                        [0, 'ted'],
                    ].find(([threshold]) => threshold <= vol)?.[1];
                    self.icon = `audio-volume-${icon}-symbolic`;
                    self.class_name = 'audioIcon'
                    self.tooltip_text = `Volume ${Math.floor(vol)}%`;
                }),
                Widget.Box({
                    children:[
                        Widget.Icon().hook(battery,self =>{
                            self.icon = battery.iconName     
                            self.class_name = "BatteryIcon"
                            self.tooltip_text = `Battery : ${battery.percent}%`
                        }),
                        Widget.Label().hook(battery,self => {
                            hpack:"start",
                            self.class_name="percentBattery"
                            self.label = `${battery.percent}%`
                        })
                    ]
                }),
            ],
        }),
    ]
})

const LeftBox=() => Widget.Box({ 
    hpack:"start",
    children:[ 
        Clock,
        Widget.Box({
            hpack:"start",
            class_name:"WorkspaceWidget",
            children:[
                Workspaces()
            ]
        }),
    ]
})

const bar = Widget.Window({
    name:"bar",
    monitor:1,
    class_name: 'bar',
    exclusivity: "exclusive",
    anchor: ['bottom', 'left', 'right'],
    child: Widget.CenterBox({
        vertical:false,
        startWidget: Widget.Box({
            hpack:"start",
            children:[
                Widget.Button({
                    hpack:"end",
                    onClicked:()=>{
                Utils.exec("rofi -show drun")
		    },
                    class_name:"startMenuBTN",
                    child:Widget.Label("󰍜")
                }),
            ]
        }),
        centerWidget: Widget.Box({
            spacing:1,
            children:[
                LeftBox(),
                focusedTitle,
                BasicInfo()
            ]
        }),
        endWidget: Widget.Box({
            hpack:"end",
            children:[
                Widget.Box({
                    class_name:"tray",
                    children: systemtray.bind('items').as(i => i.map(SysTrayItem))
                }), 
                Widget.Button({
                    hpack:"end",
                    onClicked:()=>{
                        Utils.exec("swaync-client -t")
                    },
                    class_name:"NotificationBTN",
                    child:Widget.Label({}).hook(notificationVal,self=>{
                        self.label = notificationVal.value>0?"":""
                    })
                }),
            ]
        })
    }),
})
const dashboard = Widget.Window({
    visible:false,
    name:"dashboard",
    monitor:1,
    anchor: ['bottom', 'left'], margins: [0, 0],
    child:Widget.Box({
        children:[
            Widget.Box({
                children:[
                    Widget.Icon({icon:imageLink,}),
                    Widget.Label(username)
                ]
            })
          
            
        ]
    })
});

const GiantClock = Widget.Window(
    {
        name:"GiantClock",
    monitor:1,
    layer:"background",child:
    Widget.Box({
        class_name:"GiantClock",
        vertical:true,
        children:[
            Widget.CenterBox({
             endWidget:       Widget.Label({label:".",class_name:"Star1",hpack:"end"},),
             startWidget:       Widget.Label({label:".",class_name:"Star2",hpack:"start"},),
            }),
        Widget.Label({label:time24.bind(),class_name:"GiantTitle"},),
        Widget.CenterBox({
            endWidget:       Widget.Label({label:".",class_name:"StarBottom",hpack:"end"},),
       centerWidget: Widget.Label({label:date.bind(),class_name:"GiantSubtitle"},), 

            startWidget:       Widget.Label({label:".",class_name:"StarBottom",hpack:"start"},),
           }),
    ],}),
anchor: ['top', 'left'], margins: [100, 50],})

App.config({
    style: "/home/<username>/.config/ags/style.css",
    windows: [
        bar,
        GiantClock
    ],
})
