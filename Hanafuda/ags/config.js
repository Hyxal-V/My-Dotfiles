

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
const time24 = Variable("", {
    poll: [1000, 'date +"%H:%M"'],
})
var cpu = Variable("", {
    poll: [2000, `<home-dir>/.config/ags/checkCPU.sh | sed 's/\\//g'`],
})
let MediaPlayerVisibility = Variable(false)

/** @param {import('types/service/systemtray').TrayItem} item */
const SysTrayItem = item => Widget.Button({
    child: Widget.Icon().bind('icon', item, 'icon'),
    tooltipMarkup: item.bind('tooltip_markup'),
    class_name:"trayIcon",
    onPrimaryClick: (_, event) => item.activate(event),
    onSecondaryClick: (_, event) => item.openMenu(event),
});

let FullClock  = Variable(false)
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
    self.label = hyprland.active.client.bind('address').emitter.title ==""?"   Home     ":(`   ${hyprland.active.client.bind('title').emitter.title.slice(0, 50) + (hyprland.active.client.bind('title').emitter.title.length > 50 ? '...' : ' ')}`);
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
        })
    ),

        // remove this setup hook if you want fixed number of buttons
        setup: self => self.hook(hyprland, () => self.children.forEach(btn => {
            btn.visible = hyprland.workspaces.some(ws => ws.id === btn.attribute);
        }
        
    )
  
), 
    }),
})
const BasicInfo = () => Widget.Box( {
    hpack:"end",
    children :[ 
        Widget.Box({
            class_name:"tray",
            children: systemtray.bind('items').as(i => i.map(SysTrayItem))
        }), 
        Widget.Box({
            class_name:"Ninfo",
         
            children:[
                Widget.Button({
                    onClicked:()=>{
                     Utils.exec("swaync-client -t")
                   //    console.log(hyprland.active.workspace.id)
                    },
                    class_name:"NotificationBTN",
                    child:Widget.Label({}).hook(notificationVal,self=>{
                        self.label = notificationVal.value>0?"":""
                    })
                    
                })
            ]
        }),
        Widget.Box({
    class_name:"AdvancedInfo",
    hpack:"end",
            children:[
                Widget.Box(
                    {children:[ 
    //               Widget.Label({
    ////                   class_name :"icons",
    ////                   label:""
    ////               }
      //              ),
                    Widget.Label({
                    justification: 'left',
                    class_name:"SYS",
                    visible: true,
                    label:cpu.bind()
                
                })]}),
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
                [0, 'muted'],
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

]})
const Player = () => Widget.Box({
    hpack:"start",
    class_name:"MiniPlayer",
    children:[
      Widget.Button({
          class_name:'PlayPause',
          onClicked:()=>{
            player.getPlayer().playPause()
            
        },
          //child: Widget.Label({
          //    label:'    '
          //})
          child:Widget.Label().hook(player,self=>{
            self.label = player.getPlayer().play_back_status==="Playing"? "    " :player.getPlayer()==null||player.getPlayer()=="No players found"||player.getPlayer()=="Unknown title"? "  ":"    "  
           
           
          //  self.label = player.getPlayer()==null?"    ":player.getPlayer()
          })
  }   ),
   Widget.Label().hook(player,self=>{
    self.class_name= "PlayerText"
    
   self.label = player.getPlayer()==null||player.getPlayer()=="Unknown title"?"No Media Detected":(`${player.getPlayer().track_title.slice(0, 50) + (player.getPlayer().track_title.length > 50 ? '...' : '')}`);
  
})
    ]
}) 
const LeftBox=() => Widget.Box({ 
            hpack:"start",
    children:[ 
        Clock,
        Widget.Box(
            {
            hpack:"start",
        class_name:"WorkspaceWidget",
            children:[
            Workspaces()
  ]}),
      focusedTitle
      ]
})


//class_name:"WifiIcon",
//tooltip_text:`SSID ${network.wifi.ssid}`,
//icon: network.wifi.bind('icon_name'),
const bar = Widget.Window({
    name:"bar",
    monitor:1,
    class_name: 'bar',
    exclusivity: "exclusive",
    anchor: ['bottom', 'left', 'right'],
    child: Widget.CenterBox({
        spacing:1,
        vertical:false,
        startWidget:LeftBox(),
       centerWidget: Player(),
      

        endWidget:BasicInfo()
    }),
})




const MainPlayer = Widget.Window({
    name:"MainPlayer",
    layer:"overlay",
    anchor:['bottom'],
    visible:MediaPlayerVisibility.bind(),
    margins:[5,0],
    child:Widget.Box({
        class_name:"Menu",
        vertical:false,
        children:[
            Widget.Box({
                class_name:"MainPlayerInfo",
                vertical:true,
                children:[
                    Widget.Label({class_name:"MainPlayerTitle" ,hpack:"start",label:"Music Title"}).hook(player,self=>{
   self.label = player.getPlayer()==null?"No Media Detected":(`${player.getPlayer().track_title.slice(0, 40) + (player.getPlayer().track_title.length > 40 ? '...' : '')}`);
                    }), 
                    Widget.Label({class_name:"MainPlayerArtist",hpack:"start",label:"Artist"}).hook(player,self=>{

   self.label = player.getPlayer()==null?"No Media Detected":(`${player.getPlayer().track_artists.slice(0, 30) + (player.getPlayer().track_artists.length > 30 ? '...' : '')}`);
                    })
                ],
            }),
            Widget.Box({
                spacing:1,
                children:[  Widget.Button(
            { 
                onClicked: () => player.getPlayer().previous(),
                class_name:"prev",
                child:Widget.Label({label:"",})
            }
            ),
            Widget.Button(
            {
             onClicked: () => player.getPlayer().playPause(),
                class_name:"pause",
                child:Widget.Label({label:""}).hook(player,self =>{
                    self.label = player.getPlayer().play_back_status==="Playing"? "" : ""  
                })
            }
            ),     Widget.Button(
            {
                onClicked: () => player.getPlayer().next(),
                class_name:"next",
                child:Widget.Label({label:""})
            }
            ),]
            })   
        ]
    })
})
App.config({
    style: "<home-dir>/.config/ags/style.css",
    windows: [
        bar,
     
        // you can call it, for each monitor
        // Bar(0),
        // Bar(1)
    ],
})
