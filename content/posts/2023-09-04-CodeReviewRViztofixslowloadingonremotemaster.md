---
date: 2023-09-04
layout: post
title: "Code Review: RViz to fix slow loading on remote master"
---
### Code Review: RViz to fix slow loading on remote master
#ROS 

#### To Reproduce

ROS1에서는 노드간의 통신을 위해 master가 필요하다. 보통은 하나의 PC에서 사용하여 localhost로 설정을 해두지만, 같은 네트워크 간에서 연결할 때는 마스터로 사용하는 경로인 `MASTER_URI`가 지정된다.

같은 Wifi 라우터를 통해 통신하는 경우에 RViz의 데이터 수신이 다소 느리긴 하여도 열리는 시간이 오래걸리진 않았다.

이번 대회를 하면서 LTE망+ZeroTier를 사용하면서 지역에 따라 굉장히 느리게 rviz가 열리었다.
특이점은 `Ctrl+C`를 누르면 rviz 창이 열렸다가 추후 다시 종료되게 되는데, 아마 로딩되는 프로세스가 죽고 그 이후 단계인 rviz 창이 열렸다가 종료되는 것으로 생각되어 최적화를 통해 해결할 수 있지 않을까 생각하였다.

rviz에 설정된 내용이 많아 무거울 것으로 추정하여, `rviz -d filename` 대신 기본 rviz를 실행하면 상대적으로 빠르게 열리지만, 이후 config를 로드하면 완전히 멈춰버린다.

- LTE ROS_IP + ZeroTier
- RViz with custom config

#### Code Review

**[main.cpp](https://github.com/ros-visualization/rviz/blob/noetic-devel/src/rviz/visualizer_app.cpp)**
```cpp
#include <QApplication>

#include <rviz/visualizer_app.h>

int main(int argc, char** argv)
{
  QApplication qapp(argc, argv);

  rviz::VisualizerApp vapp;
  if (vapp.init(argc, argv))
  {
    return qapp.exec();
  }
  else
  {
    return 1;
  }
}
```

**[visulizer_app.cpp](https://github.com/ros-visualization/rviz/blob/noetic-devel/src/rviz/visualizer_app.cpp)**
```cpp
// L112 - 117
bool VisualizerApp::init(int argc, char** argv)
{
  ROS_INFO("rviz version %s", get_version().c_str());
  ROS_INFO("compiled against Qt version " QT_VERSION_STR);
  ROS_INFO("compiled against OGRE version %d.%d.%d%s (%s)", OGRE_VERSION_MAJOR, OGRE_VERSION_MINOR,
           OGRE_VERSION_PATCH, OGRE_VERSION_SUFFIX, OGRE_VERSION_NAME);
```

`main.cpp`에서 불러오는 `visualizer_app`에 처음 rviz를 켤때 bash에 나오는 텍스트와 같다.
```bash
# bash에 나타나는 텍스트
# ubuntu@ubuntu:~$ rviz
[ INFO] [1693791545.852476454]: rviz version 1.14.20
[ INFO] [1693791545.852556164]: compiled against Qt version 5.12.8
[ INFO] [1693791545.852581906]: compiled against OGRE version 1.9.0 (Ghadamon)
[ INFO] [1693791545.862524804]: Forcing OpenGl version 0.
[ INFO] [1693791546.227579859]: Stereo is NOT SUPPORTED
[ INFO] [1693791546.227666094]: OpenGL device: Mesa Intel(R) UHD Graphics 620 (KBL GT2)
[ INFO] [1693791546.227701501]: OpenGl version: 4.6 (GLSL 4.6) limited to GLSL 1.4 on Mesa system.
```

그리고 master를 기다리는 부분은 아래와 같다.

```cpp
/// ...

#if CATCH_EXCEPTIONS
  try
  {
#endif
    ros::init(argc, argv, "rviz", ros::init_options::AnonymousName);

    startContinueChecker();
    
/// ...
// L182 - 189
    if (!ros::master::check())
    {
      WaitForMasterDialog dialog;
      if (dialog.exec() != QDialog::Accepted)
      {
        return false;
      }
    }

// ...

#if CATCH_EXCEPTIONS
  }
  catch (std::exception& e)
  {
    ROS_ERROR("Caught exception while loading: %s", e.what());
    return false;
  }
#endif
  return true;
}
```

하지만 master가 없을 때 기다리는 창과, 있을 때 로딩을 기다리는 화면은 다르게 나타난다.

![[rviz_waiting_for_master.png]]
*<master가 없어 기다리는 경우>*

![[splash.png]]
*<master가 있어 로딩을 기다리는 화면, 실제로는 아래 버전이 표기된다>*

실제로 [wait_for_master_dialog.cpp](https://github.com/ros-visualization/rviz/blob/noetic-devel/src/rviz/wait_for_master_dialog.cpp)를 확인해봐도 `WaitForMasterDialog`는 아래와 같은 텍스트를 내도록 되어 있다.

```cpp
WaitForMasterDialog::WaitForMasterDialog(QWidget* parent) : QMessageBox(parent)
{
  setIcon(QMessageBox::Critical);

  const std::string& master_uri = ros::master::getURI();
  std::stringstream ss;
  ss << "Could not contact ROS master at [" << master_uri << "], retrying...";

  setText(QString::fromStdString(ss.str()));
  setWindowTitle("RViz: waiting for master");
  setStandardButtons(QMessageBox::Cancel);

  QTimer* timer = new QTimer(this);
  connect(timer, &QTimer::timeout, this, &WaitForMasterDialog::onTimer);
  timer->start(1000);
}
```

그 다음 부분을 살펴보면 `VisualizationFrame`에 `-d filename`으로 불러오는 config를 사용하는 라인을 확인할 수 있다.

```cpp
/// ...
// L204 - 222
    frame_ = new VisualizationFrame();
    if (!help_path.empty())
    {
      frame_->setHelpPath(QString::fromStdString(help_path));
    }
    frame_->setShowChooseNewMaster(vm.count("in-mc-wrapper") > 0);
    if (vm.count("splash-screen"))
      frame_->setSplashPath(QString::fromStdString(splash_path));

    frame_->initialize(QString::fromStdString(display_config));

    if (!fixed_frame.empty())
      frame_->getManager()->setFixedFrame(QString::fromStdString(fixed_frame));

    frame_->getManager()->getSelectionManager()->setDebugMode(vm.count("verbose") > 0);

    if (vm.count("fullscreen"))
      frame_->setFullScreen(true);
    frame_->show();
/// ...
```
따라서 `VisualizationFrame`의 메소드인 `initialize()`와 `show()`를 살펴보았다.

**[visualization_frame.cpp](https://github.com/ros-visualization/rviz/blob/noetic-devel/src/rviz/visualization_frame.cpp)**
```cpp
/// ...
// L242 - 379
void VisualizationFrame::initialize(const QString& display_config_file)
{
  initConfigs();

  loadPersistentSettings();

  QIcon app_icon(QString::fromStdString((fs::path(package_path_) / "icons/package.png").string()));
  setWindowIcon(app_icon);

  if (splash_path_ != "")
  {
    QPixmap splash_image(splash_path_);
    splash_ = new SplashScreen(splash_image);
    splash_->show();
    connect(this, &VisualizationFrame::VisualizationFrame::statusUpdate, splash_,
            [this](const QString& message) { splash_->showMessage(message); });
  }
  Q_EMIT statusUpdate("Initializing");
```

위에서 첨부된 로딩 이미지를 보여주는 곳은 [splash_screen.cpp](https://github.com/ros-visualization/rviz/blob/noetic-devel/src/rviz/splash_screen.cpp) 이다. 따라서 이 부근에서 멈춘것으로 추정.

```cpp
  // Periodically process events for the splash screen.
  // See: http://doc.qt.io/qt-5/qsplashscreen.html#details
  QCoreApplication::processEvents();

  if (!ros::isInitialized())
  {
    int argc = 0;
    ros::init(argc, nullptr, "rviz", ros::init_options::AnonymousName);
  }

  // Periodically process events for the splash screen.
  QCoreApplication::processEvents();

  QWidget* central_widget = new QWidget(this);
  QHBoxLayout* central_layout = new QHBoxLayout;
  central_layout->setSpacing(0);
  central_layout->setMargin(0);

  render_panel_ = new RenderPanel(central_widget);

  hide_left_dock_button_ = new QToolButton();
  hide_left_dock_button_->setContentsMargins(0, 0, 0, 0);
  hide_left_dock_button_->setArrowType(Qt::LeftArrow);
  hide_left_dock_button_->setSizePolicy(QSizePolicy(QSizePolicy::Minimum, QSizePolicy::Expanding));
  hide_left_dock_button_->setFixedWidth(16);
  hide_left_dock_button_->setAutoRaise(true);
  hide_left_dock_button_->setCheckable(true);

  connect(hide_left_dock_button_, &QToolButton::toggled, this,
          &VisualizationFrame::VisualizationFrame::hideLeftDock);

  hide_right_dock_button_ = new QToolButton();
  hide_right_dock_button_->setContentsMargins(0, 0, 0, 0);
  hide_right_dock_button_->setArrowType(Qt::RightArrow);
  hide_right_dock_button_->setSizePolicy(QSizePolicy(QSizePolicy::Minimum, QSizePolicy::Expanding));
  hide_right_dock_button_->setFixedWidth(16);
  hide_right_dock_button_->setAutoRaise(true);
  hide_right_dock_button_->setCheckable(true);

  connect(hide_right_dock_button_, &QToolButton::toggled, this,
          &VisualizationFrame::VisualizationFrame::hideRightDock);

  central_layout->addWidget(hide_left_dock_button_, 0);
  central_layout->addWidget(render_panel_, 1);
  central_layout->addWidget(hide_right_dock_button_, 0);

  central_widget->setLayout(central_layout);

  // Periodically process events for the splash screen.
  QCoreApplication::processEvents();

  initMenus();

  // Periodically process events for the splash screen.
  QCoreApplication::processEvents();

  initToolbars();

  // Periodically process events for the splash screen.
  QCoreApplication::processEvents();

  setCentralWidget(central_widget);

  // Periodically process events for the splash screen.
  QCoreApplication::processEvents();

  manager_ = new VisualizationManager(render_panel_, this);
  manager_->setHelpPath(help_path_);
  connect(manager_, &VisualizationManager::escapePressed, this,
          &VisualizationFrame::VisualizationFrame::exitFullScreen);

  // Periodically process events for the splash screen.
  QCoreApplication::processEvents();

  render_panel_->initialize(manager_->getSceneManager(), manager_);

  // Periodically process events for the splash screen.
  QCoreApplication::processEvents();

  ToolManager* tool_man = manager_->getToolManager();

  connect(manager_, &VisualizationManager::configChanged, this,
          &VisualizationFrame::setDisplayConfigModified);
  connect(tool_man, &ToolManager::toolAdded, this, &VisualizationFrame::VisualizationFrame::addTool);
  connect(tool_man, &ToolManager::toolRemoved, this, &VisualizationFrame::VisualizationFrame::removeTool);
  connect(tool_man, &ToolManager::toolRefreshed, this,
          &VisualizationFrame::VisualizationFrame::refreshTool);
  connect(tool_man, &ToolManager::toolChanged, this,
          &VisualizationFrame::VisualizationFrame::indicateToolIsCurrent);

  manager_->initialize();

  // Periodically process events for the splash screen.
  QCoreApplication::processEvents();

  if (display_config_file != "")
  {
    loadDisplayConfig(display_config_file);
  }
  else
  {
    loadDisplayConfig(QString::fromStdString(default_display_config_file_));
  }

  // Periodically process events for the splash screen.
  QCoreApplication::processEvents();

  delete splash_;
  splash_ = nullptr;

  manager_->startUpdate();
  initialized_ = true;
  Q_EMIT statusUpdate("RViz is ready.");

  connect(manager_, &VisualizationManager::preUpdate, this,
          &VisualizationFrame::VisualizationFrame::updateFps);
  connect(manager_, &VisualizationManager::statusUpdate, this,
          &VisualizationFrame::VisualizationFrame::statusUpdate);
}
/// ...
```

추후 `--verbose` 옵션으로 재구성하여 구체적으로 디버깅해야할 것으로 보임.

```bash
$ rviz -v -l -d local_planner.rviz 
[ INFO] [1693831893.782386822]: rviz version 1.14.20
[ INFO] [1693831893.782429393]: compiled against Qt version 5.12.8
[ INFO] [1693831893.782445825]: compiled against OGRE version 1.9.0 (Ghadamon)
[ INFO] [1693831894.233156552]: Forcing OpenGl version 0.****

# ...중략

[ INFO] [1693831894.680779705]: Creating resources for group General
[ INFO] [1693831894.680812620]: All done
[ INFO] [1693831894.680846172]: Parsing scripts for resource group Internal
[ INFO] [1693831894.680903187]: Finished parsing scripts for resource group Internal
[ INFO] [1693831894.680942568]: Creating resources for group Internal
[ INFO] [1693831894.680974183]: All done
[ INFO] [1693831894.685315669]: GLRenderSystem::_createRenderWindow "OgreWindow(1)", 100x30 windowed  miscParams: FSAA=4 contentScalingFactor=1.000000 externalGLControl= externalWindowHandle=90177559 parentWindowHandle=90177559 
[ INFO] [1693831894.704779858]: GLXWindow::create used FBConfigID = 679
[ INFO] [1693831895.316704233]: Mesh: Loading rviz_sphere.mesh.
[ INFO] [1693831895.321399517]: Texture: SelectionRect0Texture: Loading 1 faces(PF_R8G8B8A8,1x1x1) with 0 generated mipmaps from Image. Internal format is PF_A8R8G8B8,1x1x1.
[ INFO] [1693831895.323751557]: Mesh: Loading rviz_cylinder.mesh.
[ INFO] [1693831895.324086426]: Mesh: Loading rviz_cone.mesh.
[ INFO] [1693831895.488769218]: Texture: ROSImageTexture0: Loading 1 faces(PF_L8,420x300x1) with 0 generated mipmaps from Image. Internal format is PF_L8,420x300x1.
[ INFO] [1693831903.964006272]: GLRenderSystem::_createRenderWindow "OgreWindow(2)", 640x480 windowed  miscParams: FSAA=4 contentScalingFactor=1.000000 externalGLControl= externalWindowHandle=90177806 parentWindowHandle=90177806 
```

구체적으로는 여기 부분에서 로딩이 오래걸렸다.
```bash
[ INFO] [1693832099.039088358]: GLRenderSystem::_createRenderWindow "OgreWindow(1)", 100x30 windowed  miscParams: FSAA=4 contentScalingFactor=1.000000 externalGLControl= externalWindowHandle=90177567 parentWindowHandle=90177567 
[ INFO] [1693832099.057570928]: GLXWindow::create used FBConfigID = 679
[ INFO] [1693832101.717091598]: Mesh: Loading rviz_sphere.mesh.
[ INFO] [1693832101.722365199]: Texture: SelectionRect0Texture: Loading 1 faces(PF_R8G8B8A8,1x1x1) with 0 generated mipmaps from Image. Internal format is PF_A8R8G8B8,1x1x1.
[ INFO] [1693832101.725878425]: Mesh: Loading rviz_cylinder.mesh.
[ INFO] [1693832101.726298203]: Mesh: Loading rviz_cone.mesh.
[ INFO] [1693832102.044695764]: Texture: ROSImageTexture0: Loading 1 faces(PF_L8,420x300x1) with 0 generated mipmaps from Image. Internal format is PF_L8,420x300x1.
```

그렇다면 마지막 파트인 아래 부분이 실행 중인 것으로 추측한다.
```bash
[ INFO] [1693831903.964006272]: GLRenderSystem::_createRenderWindow "OgreWindow(2)", 640x480 windowed  miscParams: FSAA=4 contentScalingFactor=1.000000 externalGLControl= externalWindowHandle=90177806 parentWindowHandle=90177806 
```



### Incorporating RViz into a Custom GUI

*Reference*
- http://docs.ros.org/en/indigo/api/librviz_tutorial/html/index.html

추후 GCS용 RViz를 제작하기 위해서 rviz를 overwrapping한 Qt를 제작해봐도 좋을 것 같다.

>[!todo] a Custom GUI RViz
> - [ ] : Incorporating RViz into a Custom GUI