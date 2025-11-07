using System;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Globalization;
using System.IO;
using System.Reflection;
using System.Resources;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Windows.Forms;
using IncliGraph_V1._1_Pro.DatosDataSetTableAdapters;
using IncliGraph_V1._1_Pro.My;
using IncliGraph_V1._1_Pro.My.Resources;
using IncliGraph_V1._1_Pro.VehiculosDataSetTableAdapters;
using Microsoft.VisualBasic;
using Microsoft.VisualBasic.CompilerServices;
using Microsoft.VisualBasic.FileIO;

namespace IncliGraph_V1._1_Pro;

[DesignerGenerated]
public class Form1 : Form
{
	private bool noche;

	private ResourceManager RM;

	private int reproducir;

	private int video_ON;

	private bool indicador;

	private SmoothingMode calidad;

	private string Ruta;

	private string[] currentRow;

	public float[,] Registro;

	public string[,] Hora;

	private float[,] angulo_calculado;

	private float FI_max;

	private float THETA_max;

	private string matricula;

	private int muestras_segundo;

	public int NUMEROREGISTROS;

	private float muestreo;

	private float ValorminimoejeX;

	private float Xminanterior;

	private float Xmaxanterior;

	public float Xmin;

	public float Xmax;

	private Matrix matriz;

	private Matrix matriz2;

	private Matrix matriz3;

	private Matrix matriz_giro;

	private float FactorescalaejeX;

	private float FactorescalaejeY;

	private float EscalaX;

	private bool botonpulsado;

	private int x1i;

	private int y1i;

	private int x2i;

	private int y2i;

	private bool botonderechopulsado;

	private int x1d;

	private int y1d;

	private int x2d;

	private int y2d;

	private int X1zoom;

	private int X2zoom;

	private int X1zoomant;

	private int X2zoomant;

	private int x1_int;

	private int contador_display;

	private int ficher_ant;

	private int ficher;

	private int valor_display;

	private int X_play;

	private Pen Lapiz_ejes;

	private Pen lapiz_ejes_secun_hor;

	private Pen lapiz_ejes_secun_vert;

	private Pen lapiz1;

	private Pen lapiz2;

	private Pen lapiz3;

	private Pen lapiz_gx;

	private Pen lapiz_gy;

	private Pen lapiz_gz;

	private Pen lapiz_4;

	private Pen Lapiz_ejes_display;

	private Pen lapiz_ejes_secun_display;

	private Pen lapiz_display;

	private Pen lapiz_vel;

	private Pen lapiz_vel_ang_crit;

	private Pen lapiz_alarma;

	public DataRow[] Lista_Fechas;

	public DataRow[] lista_Fechas_archivos;

	private DataRow[] Lista_UCO;

	private Pen lapizfiltro1;

	private Pen lapizfiltro2;

	private Pen lapizfiltro3;

	private int click_info;

	private int[,] Inicio_Grafica;

	private string hora_inicio_tramo;

	private string hora_final_tramo;

	private string[] vector_hora;

	private int HH;

	private int MM;

	private int SS;

	private string hora_String;

	private string minuto_String;

	private string segundo_String;

	private float B1;

	private float C1;

	private float D1;

	private float B2;

	private float C2;

	private float D2;

	private int T11;

	private int T21;

	private int T31;

	private int T41;

	private int T12;

	private int T22;

	private int T32;

	private int T42;

	private float KA1;

	private float KG1;

	private float KA2;

	private float KG2;

	private int Turno;

	private bool datos_cargados;

	private bool avanzado;

	private int tipovista;

	private string[] listauco;

	private float gx;

	private float gy;

	private float[,] trayectoria;

	public int indicealarma;

	public int alarmas;

	public int alarmas2;

	public int alarmas3;

	public int alarmas4;

	public int[,] matrizalarmas;

	public int[,] matrizalarmas2;

	public int[,] matrizalarmas3;

	public int[,] matrizalarmas4;

	private IContainer components;

	[CompilerGenerated]
	[AccessedThroughProperty("Button1")]
	private Button _Button1;

	[CompilerGenerated]
	[AccessedThroughProperty("PictureBox1")]
	private PictureBox _PictureBox1;

	[CompilerGenerated]
	[AccessedThroughProperty("Button3")]
	private Button _Button3;

	[CompilerGenerated]
	[AccessedThroughProperty("Button4")]
	private Button _Button4;

	[CompilerGenerated]
	[AccessedThroughProperty("HScrollBar1")]
	private HScrollBar _HScrollBar1;

	[CompilerGenerated]
	[AccessedThroughProperty("Button8")]
	private Button _Button8;

	[CompilerGenerated]
	[AccessedThroughProperty("TextBox3")]
	private TextBox _TextBox3;

	[CompilerGenerated]
	[AccessedThroughProperty("CheckBox9")]
	private CheckBox _CheckBox9;

	[CompilerGenerated]
	[AccessedThroughProperty("Button2")]
	private Button _Button2;

	[CompilerGenerated]
	[AccessedThroughProperty("CheckBox4")]
	private CheckBox _CheckBox4;

	[CompilerGenerated]
	[AccessedThroughProperty("ListBox1")]
	private ListBox _ListBox1;

	[CompilerGenerated]
	[AccessedThroughProperty("MonthCalendar1")]
	private MonthCalendar _MonthCalendar1;

	[CompilerGenerated]
	[AccessedThroughProperty("ListBox2")]
	private ListBox _ListBox2;

	[CompilerGenerated]
	[AccessedThroughProperty("Button5")]
	private Button _Button5;

	[CompilerGenerated]
	[AccessedThroughProperty("PictureBox2")]
	private PictureBox _PictureBox2;

	[CompilerGenerated]
	[AccessedThroughProperty("PictureBox3")]
	private PictureBox _PictureBox3;

	[CompilerGenerated]
	[AccessedThroughProperty("PictureBox4")]
	private PictureBox _PictureBox4;

	[CompilerGenerated]
	[AccessedThroughProperty("PictureBox5")]
	private PictureBox _PictureBox5;

	[CompilerGenerated]
	[AccessedThroughProperty("Button6")]
	private Button _Button6;

	[CompilerGenerated]
	[AccessedThroughProperty("Button7")]
	private Button _Button7;

	[CompilerGenerated]
	[AccessedThroughProperty("Button9")]
	private Button _Button9;

	[CompilerGenerated]
	[AccessedThroughProperty("PictureBox6")]
	private PictureBox _PictureBox6;

	[CompilerGenerated]
	[AccessedThroughProperty("Timer1")]
	private System.Windows.Forms.Timer _Timer1;

	[CompilerGenerated]
	[AccessedThroughProperty("TrackBar1")]
	private TrackBar _TrackBar1;

	[CompilerGenerated]
	[AccessedThroughProperty("Button12")]
	private Button _Button12;

	[CompilerGenerated]
	[AccessedThroughProperty("Button13")]
	private Button _Button13;

	[CompilerGenerated]
	[AccessedThroughProperty("CheckBox13")]
	private CheckBox _CheckBox13;

	[CompilerGenerated]
	[AccessedThroughProperty("CheckBox12")]
	private CheckBox _CheckBox12;

	[CompilerGenerated]
	[AccessedThroughProperty("CheckBox11")]
	private CheckBox _CheckBox11;

	[CompilerGenerated]
	[AccessedThroughProperty("CheckBox10")]
	private CheckBox _CheckBox10;

	[CompilerGenerated]
	[AccessedThroughProperty("CheckBox8")]
	private CheckBox _CheckBox8;

	[CompilerGenerated]
	[AccessedThroughProperty("CheckBox7")]
	private CheckBox _CheckBox7;

	[CompilerGenerated]
	[AccessedThroughProperty("CheckBox14")]
	private CheckBox _CheckBox14;

	[CompilerGenerated]
	[AccessedThroughProperty("CheckBox3")]
	private CheckBox _CheckBox3;

	[CompilerGenerated]
	[AccessedThroughProperty("Button14")]
	private Button _Button14;

	[CompilerGenerated]
	[AccessedThroughProperty("CheckBox1")]
	private CheckBox _CheckBox1;

	[CompilerGenerated]
	[AccessedThroughProperty("ComboBox1")]
	private ComboBox _ComboBox1;

	[CompilerGenerated]
	[AccessedThroughProperty("RadioButton2")]
	private RadioButton _RadioButton2;

	[CompilerGenerated]
	[AccessedThroughProperty("ComboBox2")]
	private ComboBox _ComboBox2;

	[CompilerGenerated]
	[AccessedThroughProperty("PictureBox8")]
	private PictureBox _PictureBox8;

	[CompilerGenerated]
	[AccessedThroughProperty("PictureBox9")]
	private PictureBox _PictureBox9;

	[CompilerGenerated]
	[AccessedThroughProperty("Button10")]
	private Button _Button10;

	[CompilerGenerated]
	[AccessedThroughProperty("NumericUpDown1")]
	private NumericUpDown _NumericUpDown1;

	[CompilerGenerated]
	[AccessedThroughProperty("NumericUpDown2")]
	private NumericUpDown _NumericUpDown2;

	[CompilerGenerated]
	[AccessedThroughProperty("Button11")]
	private Button _Button11;

	[CompilerGenerated]
	[AccessedThroughProperty("Button15")]
	private Button _Button15;

	[CompilerGenerated]
	[AccessedThroughProperty("Button16")]
	private Button _Button16;

	[CompilerGenerated]
	[AccessedThroughProperty("Button17")]
	private Button _Button17;

	[CompilerGenerated]
	[AccessedThroughProperty("Button18")]
	private Button _Button18;

	[CompilerGenerated]
	[AccessedThroughProperty("PictureBox15")]
	private PictureBox _PictureBox15;

	[CompilerGenerated]
	[AccessedThroughProperty("Button19")]
	private Button _Button19;

	[CompilerGenerated]
	[AccessedThroughProperty("CheckBox6")]
	private CheckBox _CheckBox6;

	[CompilerGenerated]
	[AccessedThroughProperty("CheckBox15")]
	private CheckBox _CheckBox15;

	[CompilerGenerated]
	[AccessedThroughProperty("CheckBox16")]
	private CheckBox _CheckBox16;

	[CompilerGenerated]
	[AccessedThroughProperty("TextBox25")]
	private TextBox _TextBox25;

	internal virtual Button Button1
	{
		[CompilerGenerated]
		get
		{
			return _Button1;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button1_Click;
			EventHandler value3 = Button1_HandleDestroyed;
			EventHandler value4 = Button1_SizeChanged;
			EventHandler value5 = Button1_DoubleClick;
			InvalidateEventHandler value6 = Button1_Invalidated;
			EventHandler value7 = Button1_ContextMenuStripChanged;
			Button button = _Button1;
			if (button != null)
			{
				button.Click -= value2;
				button.HandleDestroyed -= value3;
				button.SizeChanged -= value4;
				button.DoubleClick -= value5;
				button.Invalidated -= value6;
				button.ContextMenuStripChanged -= value7;
			}
			_Button1 = value;
			button = _Button1;
			if (button != null)
			{
				button.Click += value2;
				button.HandleDestroyed += value3;
				button.SizeChanged += value4;
				button.DoubleClick += value5;
				button.Invalidated += value6;
				button.ContextMenuStripChanged += value7;
			}
		}
	}

	internal virtual PictureBox PictureBox1
	{
		[CompilerGenerated]
		get
		{
			return _PictureBox1;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			PaintEventHandler value2 = PictureBox1_Paint;
			MouseEventHandler value3 = PictureBox1_MouseDown;
			MouseEventHandler value4 = PictureBox1_MouseMove;
			MouseEventHandler value5 = PictureBox1_MouseUp;
			EventHandler value6 = PictureBox1_Click;
			EventHandler value7 = PictureBox1_Disposed;
			PictureBox pictureBox = _PictureBox1;
			if (pictureBox != null)
			{
				pictureBox.Paint -= value2;
				pictureBox.MouseDown -= value3;
				pictureBox.MouseMove -= value4;
				pictureBox.MouseUp -= value5;
				pictureBox.Click -= value6;
				pictureBox.Disposed -= value7;
			}
			_PictureBox1 = value;
			pictureBox = _PictureBox1;
			if (pictureBox != null)
			{
				pictureBox.Paint += value2;
				pictureBox.MouseDown += value3;
				pictureBox.MouseMove += value4;
				pictureBox.MouseUp += value5;
				pictureBox.Click += value6;
				pictureBox.Disposed += value7;
			}
		}
	}

	internal virtual Button Button3
	{
		[CompilerGenerated]
		get
		{
			return _Button3;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button3_Click;
			Button button = _Button3;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button3 = value;
			button = _Button3;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	internal virtual Button Button4
	{
		[CompilerGenerated]
		get
		{
			return _Button4;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button4_Click;
			Button button = _Button4;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button4 = value;
			button = _Button4;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	internal virtual HScrollBar HScrollBar1
	{
		[CompilerGenerated]
		get
		{
			return _HScrollBar1;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			ScrollEventHandler value2 = HScrollBar1_Scroll;
			EventHandler value3 = HScrollBar1_ValueChanged;
			HScrollBar hScrollBar = _HScrollBar1;
			if (hScrollBar != null)
			{
				hScrollBar.Scroll -= value2;
				hScrollBar.ValueChanged -= value3;
			}
			_HScrollBar1 = value;
			hScrollBar = _HScrollBar1;
			if (hScrollBar != null)
			{
				hScrollBar.Scroll += value2;
				hScrollBar.ValueChanged += value3;
			}
		}
	}

	internal virtual Button Button8
	{
		[CompilerGenerated]
		get
		{
			return _Button8;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button8_Click;
			Button button = _Button8;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button8 = value;
			button = _Button8;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	internal virtual TextBox TextBox3
	{
		[CompilerGenerated]
		get
		{
			return _TextBox3;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = TextBox3_TextChanged;
			TextBox textBox = _TextBox3;
			if (textBox != null)
			{
				textBox.TextChanged -= value2;
			}
			_TextBox3 = value;
			textBox = _TextBox3;
			if (textBox != null)
			{
				textBox.TextChanged += value2;
			}
		}
	}

	[field: AccessedThroughProperty("TextBox4")]
	internal virtual TextBox TextBox4
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label8")]
	internal virtual Label Label8
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label9")]
	internal virtual Label Label9
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox7")]
	internal virtual TextBox TextBox7
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox8")]
	internal virtual TextBox TextBox8
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("GroupBox9")]
	internal virtual GroupBox GroupBox9
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox9")]
	internal virtual TextBox TextBox9
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual CheckBox CheckBox9
	{
		[CompilerGenerated]
		get
		{
			return _CheckBox9;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = CheckBox9_CheckedChanged;
			CheckBox checkBox = _CheckBox9;
			if (checkBox != null)
			{
				checkBox.CheckedChanged -= value2;
			}
			_CheckBox9 = value;
			checkBox = _CheckBox9;
			if (checkBox != null)
			{
				checkBox.CheckedChanged += value2;
			}
		}
	}

	internal virtual Button Button2
	{
		[CompilerGenerated]
		get
		{
			return _Button2;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button2_Click;
			Button button = _Button2;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button2 = value;
			button = _Button2;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	[field: AccessedThroughProperty("TextBox23")]
	internal virtual TextBox TextBox23
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label23")]
	internal virtual Label Label23
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("GroupBox10")]
	internal virtual GroupBox GroupBox10
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("GroupBox11")]
	internal virtual GroupBox GroupBox11
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("CheckBox2")]
	internal virtual CheckBox CheckBox2
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual CheckBox CheckBox4
	{
		[CompilerGenerated]
		get
		{
			return _CheckBox4;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = CheckBox4_CheckedChanged;
			CheckBox checkBox = _CheckBox4;
			if (checkBox != null)
			{
				checkBox.CheckedChanged -= value2;
			}
			_CheckBox4 = value;
			checkBox = _CheckBox4;
			if (checkBox != null)
			{
				checkBox.CheckedChanged += value2;
			}
		}
	}

	internal virtual ListBox ListBox1
	{
		[CompilerGenerated]
		get
		{
			return _ListBox1;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = ListBox1_SelectedIndexChanged;
			ListBox listBox = _ListBox1;
			if (listBox != null)
			{
				listBox.SelectedIndexChanged -= value2;
			}
			_ListBox1 = value;
			listBox = _ListBox1;
			if (listBox != null)
			{
				listBox.SelectedIndexChanged += value2;
			}
		}
	}

	[field: AccessedThroughProperty("Label24")]
	internal virtual Label Label24
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual MonthCalendar MonthCalendar1
	{
		[CompilerGenerated]
		get
		{
			return _MonthCalendar1;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			DateRangeEventHandler value2 = MonthCalendar1_DateChanged;
			EventHandler value3 = MonthCalendar1_DoubleClick;
			MonthCalendar monthCalendar = _MonthCalendar1;
			if (monthCalendar != null)
			{
				monthCalendar.DateChanged -= value2;
				monthCalendar.DoubleClick -= value3;
			}
			_MonthCalendar1 = value;
			monthCalendar = _MonthCalendar1;
			if (monthCalendar != null)
			{
				monthCalendar.DateChanged += value2;
				monthCalendar.DoubleClick += value3;
			}
		}
	}

	[field: AccessedThroughProperty("DatosDataSet")]
	internal virtual DatosDataSet DatosDataSet
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("DescargasBindingSource")]
	internal virtual BindingSource DescargasBindingSource
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("DescargasTableAdapter")]
	internal virtual DescargasTableAdapter DescargasTableAdapter
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("VehiculosDataSet")]
	internal virtual VehiculosDataSet VehiculosDataSet
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("RGBindingSource")]
	internal virtual BindingSource RGBindingSource
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("RGTableAdapter")]
	internal virtual RGTableAdapter RGTableAdapter
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label12")]
	internal virtual Label Label12
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual ListBox ListBox2
	{
		[CompilerGenerated]
		get
		{
			return _ListBox2;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = ListBox2_DoubleClick;
			EventHandler value3 = ListBox2_SelectedIndexChanged;
			EventHandler value4 = ListBox2_SystemColorsChanged;
			ListBox listBox = _ListBox2;
			if (listBox != null)
			{
				listBox.DoubleClick -= value2;
				listBox.SelectedIndexChanged -= value3;
				listBox.SystemColorsChanged -= value4;
			}
			_ListBox2 = value;
			listBox = _ListBox2;
			if (listBox != null)
			{
				listBox.DoubleClick += value2;
				listBox.SelectedIndexChanged += value3;
				listBox.SystemColorsChanged += value4;
			}
		}
	}

	[field: AccessedThroughProperty("Panel1")]
	internal virtual Panel Panel1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual Button Button5
	{
		[CompilerGenerated]
		get
		{
			return _Button5;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button5_Click;
			Button button = _Button5;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button5 = value;
			button = _Button5;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	internal virtual PictureBox PictureBox2
	{
		[CompilerGenerated]
		get
		{
			return _PictureBox2;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			PaintEventHandler value2 = PictureBox2_Paint;
			EventHandler value3 = PictureBox2_Click;
			EventHandler value4 = PictureBox2_PaddingChanged;
			PictureBox pictureBox = _PictureBox2;
			if (pictureBox != null)
			{
				pictureBox.Paint -= value2;
				pictureBox.Click -= value3;
				pictureBox.PaddingChanged -= value4;
			}
			_PictureBox2 = value;
			pictureBox = _PictureBox2;
			if (pictureBox != null)
			{
				pictureBox.Paint += value2;
				pictureBox.Click += value3;
				pictureBox.PaddingChanged += value4;
			}
		}
	}

	internal virtual PictureBox PictureBox3
	{
		[CompilerGenerated]
		get
		{
			return _PictureBox3;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			PaintEventHandler value2 = PictureBox3_Paint;
			EventHandler value3 = PictureBox3_Click;
			PictureBox pictureBox = _PictureBox3;
			if (pictureBox != null)
			{
				pictureBox.Paint -= value2;
				pictureBox.Click -= value3;
			}
			_PictureBox3 = value;
			pictureBox = _PictureBox3;
			if (pictureBox != null)
			{
				pictureBox.Paint += value2;
				pictureBox.Click += value3;
			}
		}
	}

	internal virtual PictureBox PictureBox4
	{
		[CompilerGenerated]
		get
		{
			return _PictureBox4;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			PaintEventHandler value2 = PictureBox4_Paint;
			PictureBox pictureBox = _PictureBox4;
			if (pictureBox != null)
			{
				pictureBox.Paint -= value2;
			}
			_PictureBox4 = value;
			pictureBox = _PictureBox4;
			if (pictureBox != null)
			{
				pictureBox.Paint += value2;
			}
		}
	}

	[field: AccessedThroughProperty("TextBox13")]
	internal virtual TextBox TextBox13
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox11")]
	internal virtual TextBox TextBox11
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label5")]
	internal virtual Label Label5
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label13")]
	internal virtual Label Label13
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox15")]
	internal virtual TextBox TextBox15
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox16")]
	internal virtual TextBox TextBox16
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox6")]
	internal virtual TextBox TextBox6
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label2")]
	internal virtual Label Label2
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual PictureBox PictureBox5
	{
		[CompilerGenerated]
		get
		{
			return _PictureBox5;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = PictureBox5_Click;
			PictureBox pictureBox = _PictureBox5;
			if (pictureBox != null)
			{
				pictureBox.Click -= value2;
			}
			_PictureBox5 = value;
			pictureBox = _PictureBox5;
			if (pictureBox != null)
			{
				pictureBox.Click += value2;
			}
		}
	}

	[field: AccessedThroughProperty("Panel2")]
	internal virtual Panel Panel2
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox1")]
	internal virtual TextBox TextBox1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox18")]
	internal virtual TextBox TextBox18
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label16")]
	internal virtual Label Label16
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox19")]
	internal virtual TextBox TextBox19
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label6")]
	internal virtual Label Label6
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label10")]
	internal virtual Label Label10
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Panel3")]
	internal virtual Panel Panel3
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Panel4")]
	internal virtual Panel Panel4
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox20")]
	internal virtual TextBox TextBox20
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox21")]
	internal virtual TextBox TextBox21
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label18")]
	internal virtual Label Label18
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox22")]
	internal virtual TextBox TextBox22
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label19")]
	internal virtual Label Label19
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label20")]
	internal virtual Label Label20
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual Button Button6
	{
		[CompilerGenerated]
		get
		{
			return _Button6;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button6_Click;
			Button button = _Button6;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button6 = value;
			button = _Button6;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	internal virtual Button Button7
	{
		[CompilerGenerated]
		get
		{
			return _Button7;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button7_Click;
			Button button = _Button7;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button7 = value;
			button = _Button7;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	internal virtual Button Button9
	{
		[CompilerGenerated]
		get
		{
			return _Button9;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button9_Click;
			Button button = _Button9;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button9 = value;
			button = _Button9;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	internal virtual PictureBox PictureBox6
	{
		[CompilerGenerated]
		get
		{
			return _PictureBox6;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = PictureBox6_Click;
			PictureBox pictureBox = _PictureBox6;
			if (pictureBox != null)
			{
				pictureBox.Click -= value2;
			}
			_PictureBox6 = value;
			pictureBox = _PictureBox6;
			if (pictureBox != null)
			{
				pictureBox.Click += value2;
			}
		}
	}

	internal virtual System.Windows.Forms.Timer Timer1
	{
		[CompilerGenerated]
		get
		{
			return _Timer1;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Timer1_Tick;
			System.Windows.Forms.Timer timer = _Timer1;
			if (timer != null)
			{
				timer.Tick -= value2;
			}
			_Timer1 = value;
			timer = _Timer1;
			if (timer != null)
			{
				timer.Tick += value2;
			}
		}
	}

	[field: AccessedThroughProperty("Label25")]
	internal virtual Label Label25
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox10")]
	internal virtual TextBox TextBox10
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label26")]
	internal virtual Label Label26
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual TrackBar TrackBar1
	{
		[CompilerGenerated]
		get
		{
			return _TrackBar1;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = TrackBar1_Scroll;
			TrackBar trackBar = _TrackBar1;
			if (trackBar != null)
			{
				trackBar.Scroll -= value2;
			}
			_TrackBar1 = value;
			trackBar = _TrackBar1;
			if (trackBar != null)
			{
				trackBar.Scroll += value2;
			}
		}
	}

	[field: AccessedThroughProperty("TextBox24")]
	internal virtual TextBox TextBox24
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual Button Button12
	{
		[CompilerGenerated]
		get
		{
			return _Button12;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button12_Click;
			Button button = _Button12;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button12 = value;
			button = _Button12;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	internal virtual Button Button13
	{
		[CompilerGenerated]
		get
		{
			return _Button13;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button13_Click;
			Button button = _Button13;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button13 = value;
			button = _Button13;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	[field: AccessedThroughProperty("Label27")]
	internal virtual Label Label27
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label17")]
	internal virtual Label Label17
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label3")]
	internal virtual Label Label3
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox27")]
	internal virtual TextBox TextBox27
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox17")]
	internal virtual TextBox TextBox17
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox2")]
	internal virtual TextBox TextBox2
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label28")]
	internal virtual Label Label28
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox28")]
	internal virtual TextBox TextBox28
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label29")]
	internal virtual Label Label29
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual CheckBox CheckBox13
	{
		[CompilerGenerated]
		get
		{
			return _CheckBox13;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = CheckBox13_CheckedChanged;
			CheckBox checkBox = _CheckBox13;
			if (checkBox != null)
			{
				checkBox.CheckedChanged -= value2;
			}
			_CheckBox13 = value;
			checkBox = _CheckBox13;
			if (checkBox != null)
			{
				checkBox.CheckedChanged += value2;
			}
		}
	}

	internal virtual CheckBox CheckBox12
	{
		[CompilerGenerated]
		get
		{
			return _CheckBox12;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = CheckBox12_CheckedChanged;
			CheckBox checkBox = _CheckBox12;
			if (checkBox != null)
			{
				checkBox.CheckedChanged -= value2;
			}
			_CheckBox12 = value;
			checkBox = _CheckBox12;
			if (checkBox != null)
			{
				checkBox.CheckedChanged += value2;
			}
		}
	}

	internal virtual CheckBox CheckBox11
	{
		[CompilerGenerated]
		get
		{
			return _CheckBox11;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = CheckBox11_CheckedChanged;
			CheckBox checkBox = _CheckBox11;
			if (checkBox != null)
			{
				checkBox.CheckedChanged -= value2;
			}
			_CheckBox11 = value;
			checkBox = _CheckBox11;
			if (checkBox != null)
			{
				checkBox.CheckedChanged += value2;
			}
		}
	}

	internal virtual CheckBox CheckBox10
	{
		[CompilerGenerated]
		get
		{
			return _CheckBox10;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = CheckBox10_CheckedChanged_1;
			CheckBox checkBox = _CheckBox10;
			if (checkBox != null)
			{
				checkBox.CheckedChanged -= value2;
			}
			_CheckBox10 = value;
			checkBox = _CheckBox10;
			if (checkBox != null)
			{
				checkBox.CheckedChanged += value2;
			}
		}
	}

	internal virtual CheckBox CheckBox8
	{
		[CompilerGenerated]
		get
		{
			return _CheckBox8;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = CheckBox8_CheckedChanged;
			CheckBox checkBox = _CheckBox8;
			if (checkBox != null)
			{
				checkBox.CheckedChanged -= value2;
			}
			_CheckBox8 = value;
			checkBox = _CheckBox8;
			if (checkBox != null)
			{
				checkBox.CheckedChanged += value2;
			}
		}
	}

	internal virtual CheckBox CheckBox7
	{
		[CompilerGenerated]
		get
		{
			return _CheckBox7;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = CheckBox7_CheckedChanged;
			CheckBox checkBox = _CheckBox7;
			if (checkBox != null)
			{
				checkBox.CheckedChanged -= value2;
			}
			_CheckBox7 = value;
			checkBox = _CheckBox7;
			if (checkBox != null)
			{
				checkBox.CheckedChanged += value2;
			}
		}
	}

	internal virtual CheckBox CheckBox14
	{
		[CompilerGenerated]
		get
		{
			return _CheckBox14;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = CheckBox14_CheckedChanged;
			CheckBox checkBox = _CheckBox14;
			if (checkBox != null)
			{
				checkBox.CheckedChanged -= value2;
			}
			_CheckBox14 = value;
			checkBox = _CheckBox14;
			if (checkBox != null)
			{
				checkBox.CheckedChanged += value2;
			}
		}
	}

	[field: AccessedThroughProperty("Label30")]
	internal virtual Label Label30
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox29")]
	internal virtual TextBox TextBox29
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label22")]
	internal virtual Label Label22
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label14")]
	internal virtual Label Label14
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label1")]
	internal virtual Label Label1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label11")]
	internal virtual Label Label11
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label21")]
	internal virtual Label Label21
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("ProgressBar1")]
	internal virtual ProgressBar ProgressBar1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label32")]
	internal virtual Label Label32
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label31")]
	internal virtual Label Label31
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual CheckBox CheckBox3
	{
		[CompilerGenerated]
		get
		{
			return _CheckBox3;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = CheckBox3_CheckedChanged;
			CheckBox checkBox = _CheckBox3;
			if (checkBox != null)
			{
				checkBox.CheckedChanged -= value2;
			}
			_CheckBox3 = value;
			checkBox = _CheckBox3;
			if (checkBox != null)
			{
				checkBox.CheckedChanged += value2;
			}
		}
	}

	internal virtual Button Button14
	{
		[CompilerGenerated]
		get
		{
			return _Button14;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button14_Click;
			Button button = _Button14;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button14 = value;
			button = _Button14;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	[field: AccessedThroughProperty("TextBox5")]
	internal virtual TextBox TextBox5
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox12")]
	internal virtual TextBox TextBox12
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label4")]
	internal virtual Label Label4
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual CheckBox CheckBox1
	{
		[CompilerGenerated]
		get
		{
			return _CheckBox1;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = CheckBox1_CheckedChanged;
			CheckBox checkBox = _CheckBox1;
			if (checkBox != null)
			{
				checkBox.CheckedChanged -= value2;
			}
			_CheckBox1 = value;
			checkBox = _CheckBox1;
			if (checkBox != null)
			{
				checkBox.CheckedChanged += value2;
			}
		}
	}

	[field: AccessedThroughProperty("Label7")]
	internal virtual Label Label7
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label15")]
	internal virtual Label Label15
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label33")]
	internal virtual Label Label33
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual ComboBox ComboBox1
	{
		[CompilerGenerated]
		get
		{
			return _ComboBox1;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = ComboBox1_SelectedIndexChanged;
			ComboBox comboBox = _ComboBox1;
			if (comboBox != null)
			{
				comboBox.SelectedIndexChanged -= value2;
			}
			_ComboBox1 = value;
			comboBox = _ComboBox1;
			if (comboBox != null)
			{
				comboBox.SelectedIndexChanged += value2;
			}
		}
	}

	[field: AccessedThroughProperty("Label35")]
	internal virtual Label Label35
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label36")]
	internal virtual Label Label36
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label34")]
	internal virtual Label Label34
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("GroupBox1")]
	internal virtual GroupBox GroupBox1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("PictureBox7")]
	internal virtual PictureBox PictureBox7
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Panel5")]
	internal virtual Panel Panel5
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label39")]
	internal virtual Label Label39
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label38")]
	internal virtual Label Label38
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label37")]
	internal virtual Label Label37
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Panel6")]
	internal virtual Panel Panel6
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label42")]
	internal virtual Label Label42
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label40")]
	internal virtual Label Label40
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label41")]
	internal virtual Label Label41
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("RadioButton1")]
	internal virtual RadioButton RadioButton1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual RadioButton RadioButton2
	{
		[CompilerGenerated]
		get
		{
			return _RadioButton2;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = RadioButton2_CheckedChanged;
			RadioButton radioButton = _RadioButton2;
			if (radioButton != null)
			{
				radioButton.CheckedChanged -= value2;
			}
			_RadioButton2 = value;
			radioButton = _RadioButton2;
			if (radioButton != null)
			{
				radioButton.CheckedChanged += value2;
			}
		}
	}

	internal virtual ComboBox ComboBox2
	{
		[CompilerGenerated]
		get
		{
			return _ComboBox2;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = ComboBox2_SelectedIndexChanged;
			ComboBox comboBox = _ComboBox2;
			if (comboBox != null)
			{
				comboBox.SelectedIndexChanged -= value2;
			}
			_ComboBox2 = value;
			comboBox = _ComboBox2;
			if (comboBox != null)
			{
				comboBox.SelectedIndexChanged += value2;
			}
		}
	}

	[field: AccessedThroughProperty("Label43")]
	internal virtual Label Label43
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label44")]
	internal virtual Label Label44
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox14")]
	internal virtual TextBox TextBox14
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Panel7")]
	internal virtual Panel Panel7
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Panel8")]
	internal virtual Panel Panel8
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual PictureBox PictureBox8
	{
		[CompilerGenerated]
		get
		{
			return _PictureBox8;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			PaintEventHandler value2 = PictureBox8_Paint;
			PictureBox pictureBox = _PictureBox8;
			if (pictureBox != null)
			{
				pictureBox.Paint -= value2;
			}
			_PictureBox8 = value;
			pictureBox = _PictureBox8;
			if (pictureBox != null)
			{
				pictureBox.Paint += value2;
			}
		}
	}

	internal virtual PictureBox PictureBox9
	{
		[CompilerGenerated]
		get
		{
			return _PictureBox9;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			PaintEventHandler value2 = PictureBox9_Paint;
			PictureBox pictureBox = _PictureBox9;
			if (pictureBox != null)
			{
				pictureBox.Paint -= value2;
			}
			_PictureBox9 = value;
			pictureBox = _PictureBox9;
			if (pictureBox != null)
			{
				pictureBox.Paint += value2;
			}
		}
	}

	[field: AccessedThroughProperty("CheckBox5")]
	internal virtual CheckBox CheckBox5
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual Button Button10
	{
		[CompilerGenerated]
		get
		{
			return _Button10;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button10_Click;
			Button button = _Button10;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button10 = value;
			button = _Button10;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	internal virtual NumericUpDown NumericUpDown1
	{
		[CompilerGenerated]
		get
		{
			return _NumericUpDown1;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = NumericUpDown1_ValueChanged;
			NumericUpDown numericUpDown = _NumericUpDown1;
			if (numericUpDown != null)
			{
				numericUpDown.ValueChanged -= value2;
			}
			_NumericUpDown1 = value;
			numericUpDown = _NumericUpDown1;
			if (numericUpDown != null)
			{
				numericUpDown.ValueChanged += value2;
			}
		}
	}

	internal virtual NumericUpDown NumericUpDown2
	{
		[CompilerGenerated]
		get
		{
			return _NumericUpDown2;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = NumericUpDown2_ValueChanged;
			NumericUpDown numericUpDown = _NumericUpDown2;
			if (numericUpDown != null)
			{
				numericUpDown.ValueChanged -= value2;
			}
			_NumericUpDown2 = value;
			numericUpDown = _NumericUpDown2;
			if (numericUpDown != null)
			{
				numericUpDown.ValueChanged += value2;
			}
		}
	}

	[field: AccessedThroughProperty("GroupBox2")]
	internal virtual GroupBox GroupBox2
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("GroupBox3")]
	internal virtual GroupBox GroupBox3
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual Button Button11
	{
		[CompilerGenerated]
		get
		{
			return _Button11;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button11_Click;
			Button button = _Button11;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button11 = value;
			button = _Button11;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	internal virtual Button Button15
	{
		[CompilerGenerated]
		get
		{
			return _Button15;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button15_Click;
			Button button = _Button15;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button15 = value;
			button = _Button15;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	[field: AccessedThroughProperty("GroupBox4")]
	internal virtual GroupBox GroupBox4
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual Button Button16
	{
		[CompilerGenerated]
		get
		{
			return _Button16;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button16_Click;
			Button button = _Button16;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button16 = value;
			button = _Button16;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	internal virtual Button Button17
	{
		[CompilerGenerated]
		get
		{
			return _Button17;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button17_Click;
			Button button = _Button17;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button17 = value;
			button = _Button17;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	internal virtual Button Button18
	{
		[CompilerGenerated]
		get
		{
			return _Button18;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button18_Click;
			Button button = _Button18;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button18 = value;
			button = _Button18;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	[field: AccessedThroughProperty("PictureBox10")]
	internal virtual PictureBox PictureBox10
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("PictureBox11")]
	internal virtual PictureBox PictureBox11
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("PictureBox12")]
	internal virtual PictureBox PictureBox12
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("PictureBox13")]
	internal virtual PictureBox PictureBox13
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("PictureBox14")]
	internal virtual PictureBox PictureBox14
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual PictureBox PictureBox15
	{
		[CompilerGenerated]
		get
		{
			return _PictureBox15;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = PictureBox15_AutoSizeChanged;
			PictureBox pictureBox = _PictureBox15;
			if (pictureBox != null)
			{
				pictureBox.AutoSizeChanged -= value2;
			}
			_PictureBox15 = value;
			pictureBox = _PictureBox15;
			if (pictureBox != null)
			{
				pictureBox.AutoSizeChanged += value2;
			}
		}
	}

	internal virtual Button Button19
	{
		[CompilerGenerated]
		get
		{
			return _Button19;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button19_Click;
			Button button = _Button19;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button19 = value;
			button = _Button19;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	[field: AccessedThroughProperty("Label45")]
	internal virtual Label Label45
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual CheckBox CheckBox6
	{
		[CompilerGenerated]
		get
		{
			return _CheckBox6;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = CheckBox6_CheckedChanged;
			CheckBox checkBox = _CheckBox6;
			if (checkBox != null)
			{
				checkBox.CheckedChanged -= value2;
			}
			_CheckBox6 = value;
			checkBox = _CheckBox6;
			if (checkBox != null)
			{
				checkBox.CheckedChanged += value2;
			}
		}
	}

	internal virtual CheckBox CheckBox15
	{
		[CompilerGenerated]
		get
		{
			return _CheckBox15;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = CheckBox15_CheckedChanged;
			CheckBox checkBox = _CheckBox15;
			if (checkBox != null)
			{
				checkBox.CheckedChanged -= value2;
			}
			_CheckBox15 = value;
			checkBox = _CheckBox15;
			if (checkBox != null)
			{
				checkBox.CheckedChanged += value2;
			}
		}
	}

	internal virtual CheckBox CheckBox16
	{
		[CompilerGenerated]
		get
		{
			return _CheckBox16;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = CheckBox16_CheckedChanged;
			CheckBox checkBox = _CheckBox16;
			if (checkBox != null)
			{
				checkBox.CheckedChanged -= value2;
			}
			_CheckBox16 = value;
			checkBox = _CheckBox16;
			if (checkBox != null)
			{
				checkBox.CheckedChanged += value2;
			}
		}
	}

	internal virtual TextBox TextBox25
	{
		[CompilerGenerated]
		get
		{
			return _TextBox25;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = TextBox25_TextChanged;
			EventHandler value3 = TextBox25_Click;
			TextBox textBox = _TextBox25;
			if (textBox != null)
			{
				textBox.TextChanged -= value2;
				textBox.Click -= value3;
			}
			_TextBox25 = value;
			textBox = _TextBox25;
			if (textBox != null)
			{
				textBox.TextChanged += value2;
				textBox.Click += value3;
			}
		}
	}

	public Form1()
	{
		base.FormClosing += Form1_FormClosing;
		base.Load += Form1_Load;
		base.SizeChanged += Form1_SizeChanged;
		RM = new ResourceManager("IncliGraph_V1._1_Pro.frases", Assembly.GetExecutingAssembly());
		reproducir = 0;
		video_ON = 0;
		indicador = false;
		calidad = SmoothingMode.Default;
		Registro = new float[25, 1];
		Hora = new string[1, 1];
		angulo_calculado = new float[1, 1];
		FI_max = 0f;
		THETA_max = 0f;
		matricula = "";
		muestras_segundo = 10;
		NUMEROREGISTROS = 0;
		muestreo = 10f;
		ValorminimoejeX = 0f;
		Xmin = 0f;
		Xmax = 300f;
		FactorescalaejeX = 1f;
		FactorescalaejeY = 1f;
		EscalaX = 1f;
		X1zoom = 0;
		X2zoom = 0;
		X1zoomant = 0;
		X2zoomant = 0;
		contador_display = 0;
		ficher_ant = 0;
		ficher = 0;
		valor_display = 0;
		X_play = 0;
		Lapiz_ejes = new Pen(Color.Black, 1f);
		lapiz_ejes_secun_hor = new Pen(Color.LightGray, 1f);
		lapiz_ejes_secun_vert = new Pen(Color.LightGray, 1f);
		lapiz1 = new Pen(Color.Blue, 2f);
		lapiz2 = new Pen(Color.Red, 2f);
		lapiz3 = new Pen(Color.Orange, 2f);
		lapiz_gx = new Pen(Color.Blue, 2f);
		lapiz_gy = new Pen(Color.Red, 2f);
		lapiz_gz = new Pen(Color.Orange, 2f);
		lapiz_4 = new Pen(Color.LightSteelBlue, 2f);
		Lapiz_ejes_display = new Pen(Color.Blue, 2f);
		lapiz_ejes_secun_display = new Pen(Color.White, 2f);
		lapiz_display = new Pen(Color.Orange, 1f);
		lapiz_vel = new Pen(Color.Green, 1f);
		lapiz_vel_ang_crit = new Pen(Color.Black, 1f);
		lapiz_alarma = new Pen(Color.Red, 1f);
		lapizfiltro1 = new Pen(Color.DarkBlue, 1f);
		lapizfiltro2 = new Pen(Color.DarkRed, 1f);
		lapizfiltro3 = new Pen(Color.Orange, 1f);
		click_info = 0;
		Inicio_Grafica = new int[2, 1];
		hora_inicio_tramo = "";
		hora_final_tramo = "";
		HH = 0;
		MM = 0;
		SS = 0;
		datos_cargados = false;
		avanzado = false;
		tipovista = 0;
		trayectoria = new float[2, 1];
		matrizalarmas = new int[2, 1];
		matrizalarmas2 = new int[2, 1];
		matrizalarmas3 = new int[2, 1];
		matrizalarmas4 = new int[2, 1];
		InitializeComponent();
	}

	private void actualizarbarra()
	{
		HScrollBar1.Minimum = 0;
		checked
		{
			HScrollBar1.Maximum = (int)Math.Round((float)(NUMEROREGISTROS - 1) - (Xmax - Xmin));
			HScrollBar1.Value = (int)Math.Round(Xmin);
		}
	}

	private void Button1_Click(object sender, EventArgs e)
	{
		Thread.CurrentThread.CurrentCulture = new CultureInfo("es-ES");
		if (ListBox2.SelectedIndex < 0)
		{
			return;
		}
		MyProject.Forms.barra.Show();
		MyProject.Forms.barra.ProgressBar1.Minimum = 0;
		MyProject.Forms.barra.ProgressBar1.Maximum = Inicio_Grafica[1, ListBox2.SelectedIndex];
		MyProject.Forms.barra.ProgressBar1.Value = 0;
		MyProject.Forms.barra.Update();
		Cursor = Cursors.WaitCursor;
		FI_max = 0f;
		THETA_max = 0f;
		matrizalarmas = new int[2, 1];
		matrizalarmas2 = new int[2, 1];
		matrizalarmas3 = new int[2, 1];
		matrizalarmas4 = new int[2, 1];
		alarmas = 0;
		alarmas2 = 0;
		alarmas3 = 0;
		alarmas4 = 0;
		string text = Conversions.ToString(lista_Fechas_archivos[ListBox2.SelectedIndex][6]);
		string[] array = Strings.Split(Conversions.ToString(lista_Fechas_archivos[ListBox2.SelectedIndex][7]), ":", -1, CompareMethod.Text);
		_ = array[0] + "." + array[1] + "." + array[2];
		string[] array2 = Strings.Split(text, "-", -1, CompareMethod.Text);
		string text2 = Conversions.ToString(lista_Fechas_archivos[ListBox2.SelectedIndex][1]);
		if (text2.Length == 1)
		{
			text2 = "00000" + text2;
		}
		else if (text2.Length == 2)
		{
			text2 = "0000" + text2;
		}
		else if (text2.Length == 3)
		{
			text2 = "000" + text2;
		}
		else if (text2.Length == 4)
		{
			text2 = "00" + text2;
		}
		else if (text2.Length == 5)
		{
			text2 = "0" + text2;
		}
		string text3 = Conversions.ToString(lista_Fechas_archivos[ListBox2.SelectedIndex][2]);
		if (text3.Length == 1)
		{
			text3 = "0000" + text3;
		}
		else if (text3.Length == 2)
		{
			text3 = "000" + text3;
		}
		else if (text3.Length == 3)
		{
			text3 = "00" + text3;
		}
		else if (text3.Length == 4)
		{
			text3 = "0" + text3;
		}
		Ruta = MyProject.Forms.Principal.ruta_raiz + "\\VEXT-IS1-" + text2 + "\\" + array2[2] + "\\" + text2 + " - " + text + ".csv";
		MessageBox.Show(Ruta);
		checked
		{
			using (TextFieldParser textFieldParser = new TextFieldParser(Ruta))
			{
				textFieldParser.TextFieldType = FieldType.Delimited;
				textFieldParser.SetDelimiters(";");
				int num = 0;
				int num2 = 0;
				int num3 = 0;
				while (!textFieldParser.EndOfData)
				{
					if (num < Inicio_Grafica[0, ListBox2.SelectedIndex] - 1)
					{
						textFieldParser.ReadFields();
					}
					else if (num == Inicio_Grafica[0, ListBox2.SelectedIndex] - 1)
					{
						string[] array3 = textFieldParser.ReadFields();
						int num4 = Conversions.ToInteger(array3[0]);
						vector_hora = Strings.Split(array3[3], ":", -1, CompareMethod.Text);
						HH = Conversions.ToInteger(vector_hora[0]);
						MM = Conversions.ToInteger(vector_hora[1]);
						SS = Conversions.ToInteger(vector_hora[2]);
						Thread.CurrentThread.CurrentCulture = new CultureInfo("es-ES");
						DateTime dateTime = Conversions.ToDate(array3[2]);
						string name = MySettingsProperty.Settings.idioma;
						Thread.CurrentThread.CurrentCulture = new CultureInfo(name);
						TextBox2.Text = dateTime.Date.ToString().Substring(0, 10);
						TextBox17.Text = array3[3];
						TextBox28.Text = Conversions.ToString(num4);
						B1 = String_a_Numero(array3[4]);
						C1 = String_a_Numero(array3[5]);
						D1 = String_a_Numero(array3[6]);
						B2 = String_a_Numero(array3[7]);
						C2 = String_a_Numero(array3[8]);
						D2 = String_a_Numero(array3[9]);
						T11 = Conversions.ToInteger(Conversions.ToString(array3[10][0]) + Conversions.ToString(array3[10][1]));
						T21 = Conversions.ToInteger(Conversions.ToString(array3[10][2]) + Conversions.ToString(array3[10][3]));
						T31 = Conversions.ToInteger(Conversions.ToString(array3[10][4]) + Conversions.ToString(array3[10][5]));
						T41 = Conversions.ToInteger(Conversions.ToString(array3[10][6]) + Conversions.ToString(array3[10][7]));
						T12 = Conversions.ToInteger(Conversions.ToString(array3[11][0]) + Conversions.ToString(array3[11][1]));
						T22 = Conversions.ToInteger(Conversions.ToString(array3[11][2]) + Conversions.ToString(array3[11][3]));
						T32 = Conversions.ToInteger(Conversions.ToString(array3[11][4]) + Conversions.ToString(array3[11][5]));
						T42 = Conversions.ToInteger(Conversions.ToString(array3[11][6]) + Conversions.ToString(array3[11][7]));
						KA1 = String_a_Numero(array3[12]);
						KG1 = String_a_Numero(array3[13]);
						KA2 = String_a_Numero(array3[14]);
						KG2 = String_a_Numero(array3[15]);
						TextBox14.Text = array3[16];
					}
					else
					{
						currentRow = textFieldParser.ReadFields();
						if (currentRow.Length == 18)
						{
							break;
						}
						if (currentRow.Length == 1)
						{
							vector_hora = Strings.Split(currentRow[0], ":", -1, CompareMethod.Text);
							HH = Conversions.ToInteger(vector_hora[0]);
							MM = Conversions.ToInteger(vector_hora[1]);
							SS = Conversions.ToInteger(vector_hora[2]);
							num3 = 0;
						}
						else
						{
							ref float[,] registro = ref Registro;
							registro = (float[,])Utils.CopyArray(registro, new float[25, num2 + 1]);
							ref string[,] hora = ref Hora;
							hora = (string[,])Utils.CopyArray(hora, new string[1, num2 + 1]);
							try
							{
								if (String_a_Numero(currentRow[15]) > 3f)
								{
									alarmas4++;
									ref int[,] reference = ref matrizalarmas4;
									reference = (int[,])Utils.CopyArray(reference, new int[2, alarmas4 + 1]);
									matrizalarmas4[0, alarmas4] = num2;
									matrizalarmas4[1, alarmas4] = (int)Math.Round(String_a_Numero(currentRow[15]));
								}
								if (String_a_Numero(currentRow[15]) > 2f)
								{
									alarmas3++;
									ref int[,] reference2 = ref matrizalarmas3;
									reference2 = (int[,])Utils.CopyArray(reference2, new int[2, alarmas3 + 1]);
									matrizalarmas3[0, alarmas3] = num2;
									matrizalarmas3[1, alarmas3] = (int)Math.Round(String_a_Numero(currentRow[15]));
								}
								if (String_a_Numero(currentRow[15]) > 1f)
								{
									alarmas2++;
									ref int[,] reference3 = ref matrizalarmas2;
									reference3 = (int[,])Utils.CopyArray(reference3, new int[2, alarmas2 + 1]);
									matrizalarmas2[0, alarmas2] = num2;
									matrizalarmas2[1, alarmas2] = (int)Math.Round(String_a_Numero(currentRow[15]));
								}
								if (String_a_Numero(currentRow[15]) > 0f)
								{
									alarmas++;
									ref int[,] reference4 = ref matrizalarmas;
									reference4 = (int[,])Utils.CopyArray(reference4, new int[2, alarmas + 1]);
									matrizalarmas[0, alarmas] = num2;
									matrizalarmas[1, alarmas] = (int)Math.Round(String_a_Numero(currentRow[15]));
								}
							}
							catch (Exception projectError)
							{
								ProjectData.SetProjectError(projectError);
								num2 = num2;
								ProjectData.ClearProjectError();
							}
							Registro[0, num2] = Conversions.ToSingle(Conversions.ToString(num2));
							int result = 0;
							Math.DivRem(num3, 10, out result);
							if (result == 0)
							{
								SS++;
								if (SS > 59)
								{
									MM++;
									SS = 0;
									if (MM > 59)
									{
										HH++;
										MM = 0;
										if (HH > 23)
										{
											HH = 0;
										}
									}
								}
							}
							if (HH < 10)
							{
								hora_String = "0" + Conversions.ToString(HH);
							}
							else
							{
								hora_String = Conversions.ToString(HH);
							}
							if (MM < 10)
							{
								minuto_String = "0" + Conversions.ToString(MM);
							}
							else
							{
								minuto_String = Conversions.ToString(MM);
							}
							if (SS < 10)
							{
								segundo_String = "0" + Conversions.ToString(SS);
							}
							else
							{
								segundo_String = Conversions.ToString(SS);
							}
							Hora[0, num2] = hora_String + ":" + minuto_String + ":" + segundo_String;
							int num5 = 3;
							do
							{
								if (Operators.CompareString(currentRow[num5 + 2], "", TextCompare: false) == 0)
								{
									Registro[num5, num2] = 0f;
								}
								else
								{
									Registro[num5, num2] = String_a_Numero(currentRow[num5 + 2]);
								}
								num5++;
							}
							while (num5 <= 17);
							if (CheckBox5.Checked)
							{
								Registro[18, num2] = String_a_Numero(currentRow[0]) * -1f;
								Registro[19, num2] = String_a_Numero(currentRow[1]) * 1f;
								Registro[20, num2] = String_a_Numero(currentRow[2]) * -1f;
							}
							else
							{
								Registro[18, num2] = String_a_Numero(currentRow[0]) * 1f;
								Registro[19, num2] = String_a_Numero(currentRow[1]) * 1f;
								Registro[20, num2] = String_a_Numero(currentRow[2]) * 1f;
							}
							Registro[21, num2] = String_a_Numero(currentRow[3]);
							Registro[22, num2] = String_a_Numero(currentRow[4]);
							Registro[23, num2] = (float)(Math.Round(100.0 * Math.Atan(String_a_Numero(currentRow[0]) / String_a_Numero(currentRow[1])) * 180.0 / Math.PI) / 100.0);
							float num6;
							float num7;
							if (CheckBox5.Checked)
							{
								num6 = (float)(Math.Atan(String_a_Numero(currentRow[5]) / String_a_Numero(currentRow[7])) * -180.0 / Math.PI);
								num7 = (float)(Math.Atan(String_a_Numero(currentRow[6]) / String_a_Numero(currentRow[7])) * -180.0 / Math.PI);
							}
							else
							{
								num6 = (float)(Math.Atan(String_a_Numero(currentRow[5]) / String_a_Numero(currentRow[7])) * 180.0 / Math.PI);
								num7 = (float)(Math.Atan(String_a_Numero(currentRow[6]) / String_a_Numero(currentRow[7])) * 180.0 / Math.PI);
							}
							num6 = (float)(Math.Round(100f * num6) / 100.0);
							num7 = (float)(Math.Round(100f * num7) / 100.0);
							float num8;
							float num9;
							float num10;
							if (Registro[17, num2] == 0f)
							{
								num8 = C1;
								num9 = B1;
								num10 = D1;
							}
							else
							{
								num8 = C2;
								num9 = B2;
								num10 = D2;
							}
							float num11 = (float)((double)num9 * (1.0 - Math.Sin((double)(num8 + Math.Abs(num6)) * 3.1416 / 180.0)));
							float num12 = (float)(180.0 * Math.Sqrt(num10 * num11) / 3.1416);
							float num13 = (float)((double)(100f * (1f - Math.Abs(num6) / (90f - num8))) * (1.0 - Math.Pow(Registro[7, num2] / num12, 2.0)));
							Registro[24, num2] = num13;
							Registro[1, num2] = num6;
							Registro[2, num2] = num7;
							if (Math.Abs(Registro[23, num2]) > FI_max)
							{
								FI_max = Math.Abs(Registro[23, num2]);
							}
							if (Math.Abs(Registro[1, num2]) > THETA_max)
							{
								THETA_max = Math.Abs(Registro[2, num2]);
							}
							num2++;
							num3++;
							MyProject.Forms.barra.Label1.Text = RM.GetString("cargando") + " " + Conversions.ToString(Math.Round((double)(num2 * 100) / (double)Inicio_Grafica[1, ListBox2.SelectedIndex])) + "% " + RM.GetString("completado");
							MyProject.Forms.barra.ProgressBar1.Value = num2;
							MyProject.Forms.barra.Refresh();
							Application.DoEvents();
						}
					}
					num++;
				}
				NUMEROREGISTROS = num2;
				adjudicarvaloresiniciales();
				string text4 = Conversions.ToString((int)(double)((float)NUMEROREGISTROS / (muestreo * 60f * 60f)));
				string text5 = Conversions.ToString((int)Math.Round(Math.Truncate((float)NUMEROREGISTROS / (muestreo * 60f)) - Conversions.ToDouble(text4) * 60.0));
				string text6 = Conversions.ToString((int)Math.Round(Math.Truncate((float)NUMEROREGISTROS / muestreo) - Conversions.ToDouble(text4) - Conversions.ToDouble(text5) * 60.0));
				if (text4.Length == 1)
				{
					text4 = "0" + text4;
				}
				if (text5.Length == 1)
				{
					text5 = "0" + text5;
				}
				if (text6.Length == 1)
				{
					text6 = "0" + text6;
				}
				string text7 = text4 + ":" + text5 + ":" + text6;
				TextBox27.Text = text7;
				TextBox3.Text = Conversions.ToString(FI_max);
				TextBox4.Text = Conversions.ToString(THETA_max);
				trayectoria = new float[2, NUMEROREGISTROS + 1];
				trayectoria[0, 0] = 0f;
				trayectoria[1, 0] = 0f;
				float num14 = 0f;
				float num15 = 0f;
				int num16 = NUMEROREGISTROS - 1;
				for (int i = 1; i <= num16; i++)
				{
					num15 = (float)((double)num14 + ((double)Registro[8, i - 1] - 1.832) * 0.1);
					num14 = num15;
					trayectoria[0, i] = (float)((double)trayectoria[0, i - 1] + (double)(Registro[14, i - 1] / 36f) * Math.Cos(Math.PI * (double)num15 / 180.0));
					trayectoria[1, i] = (float)((double)trayectoria[1, i - 1] + (double)(Registro[14, i - 1] / 36f) * Math.Sin(Math.PI * (double)num15 / 180.0));
				}
				indicador = false;
			}
			datos_cargados = true;
			Button2.Enabled = true;
			Cursor = Cursors.Arrow;
			MyProject.Forms.barra.Close();
			Dibujar();
			decimal value = NumericUpDown2.Value;
			if (decimal.Compare(value, 1m) == 0)
			{
				TextBox3.Text = Conversions.ToString(alarmas);
			}
			else if (decimal.Compare(value, 2m) == 0)
			{
				TextBox3.Text = Conversions.ToString(alarmas2);
			}
			else if (decimal.Compare(value, 3m) == 0)
			{
				TextBox3.Text = Conversions.ToString(alarmas3);
			}
			else if (decimal.Compare(value, 4m) == 0)
			{
				TextBox3.Text = Conversions.ToString(alarmas4);
			}
		}
	}

	private float String_a_Numero(string cadena)
	{
		checked
		{
			int num = cadena.Length - 1;
			string text = "";
			int num2 = num;
			for (int i = 0; i <= num2; i++)
			{
				text = ((Operators.CompareString(Conversions.ToString(cadena[i]), ".", TextCompare: false) != 0) ? (text + Conversions.ToString(cadena[i])) : ((Operators.CompareString(Thread.CurrentThread.CurrentCulture.Name, "en-US", TextCompare: false) == 0) ? (text + Conversions.ToString(cadena[i])) : (text + ",")));
			}
			return Conversions.ToSingle(text);
		}
	}

	private string Numero_a_String(float cadena)
	{
		string text = Conversions.ToString(cadena);
		checked
		{
			int num = text.Length - 1;
			string text2 = "";
			int num2 = num;
			for (int i = 0; i <= num2; i++)
			{
				text2 = ((Operators.CompareString(Conversions.ToString(text[i]), ",", TextCompare: false) != 0) ? (text2 + Conversions.ToString(text[i])) : (text2 + "."));
			}
			return text2;
		}
	}

	private void adjudicarvaloresiniciales()
	{
		X1zoom = 0;
		X2zoom = 0;
		X1zoomant = 0;
		X2zoomant = 0;
		FactorescalaejeX = 1f;
		Xmin = ValorminimoejeX;
		x1_int = 0;
		checked
		{
			if (NUMEROREGISTROS - 1 > 600)
			{
				Xmax = 600f;
			}
			else
			{
				Xmax = NUMEROREGISTROS - 1;
			}
			Xminanterior = Xmin;
			Xmaxanterior = Xmax;
			actualizarbarra();
		}
	}

	private void Dibujar()
	{
		if (datos_cargados)
		{
			if (video_ON == 0)
			{
				PictureBox1.Invalidate();
				PictureBox2.Invalidate();
				if (RadioButton2.Checked)
				{
					PictureBox3.Invalidate();
				}
				PictureBox8.Invalidate();
				PictureBox9.Invalidate();
			}
			else
			{
				PictureBox1.Invalidate();
				PictureBox2.Invalidate();
				PictureBox8.Invalidate();
				PictureBox9.Invalidate();
				if (RadioButton2.Checked)
				{
					PictureBox3.Invalidate();
				}
			}
		}
		else
		{
			PictureBox1.Invalidate();
			PictureBox8.Invalidate();
		}
	}

	private void PictureBox1_Paint(object sender, PaintEventArgs e)
	{
		Graphics graphics = e.Graphics;
		graphics.Clear(PictureBox1.BackColor);
		checked
		{
			try
			{
				float num = 30f;
				float num2 = -30f;
				float num3 = Math.Max(Math.Abs(num), Math.Abs(num2));
				float num4 = 100f;
				float num5 = 50f;
				EscalaX = FactorescalaejeX * ((float)PictureBox1.Width + ValorminimoejeX) / (Xmax - Xmin);
				matriz = new Matrix();
				matriz2 = new Matrix();
				matriz3 = new Matrix();
				matriz_giro = new Matrix();
				matriz.Scale(EscalaX, -1f * FactorescalaejeY * ((float)PictureBox1.Height + ValorminimoejeX) / (2f * num3));
				matriz2.Scale(EscalaX, -1f * FactorescalaejeY * ((float)PictureBox1.Height + ValorminimoejeX) / (2f * num3));
				matriz3.Scale(EscalaX, -1f * FactorescalaejeY * ((float)PictureBox1.Height + ValorminimoejeX) / (2f * num4));
				matriz_giro.Scale(EscalaX, -1f * FactorescalaejeY * ((float)PictureBox1.Height + ValorminimoejeX) / (2f * num5));
				matriz.Translate(0f - Xmin, (float)((double)(-PictureBox1.Height) / 2.0 / (double)(FactorescalaejeY * ((float)PictureBox1.Height + ValorminimoejeX) / (2f * num3))));
				matriz2.Translate(0f - Xmin, (float)((double)(-PictureBox1.Height) / 2.0 / (double)(FactorescalaejeY * ((float)PictureBox1.Height + ValorminimoejeX) / (2f * num3))));
				matriz3.Translate(0f - Xmin, (float)((double)(-PictureBox1.Height) / 2.0 / (double)(FactorescalaejeY * ((float)PictureBox1.Height + ValorminimoejeX) / (2f * num4))));
				matriz_giro.Translate(0f - Xmin, (float)((double)(-PictureBox1.Height) / 2.0 / (double)(FactorescalaejeY * ((float)PictureBox1.Height + ValorminimoejeX) / (2f * num5))));
				GraphicsPath graphicsPath = new GraphicsPath();
				graphicsPath.AddLine(new PointF(Xmin, 0f), new PointF(Xmax, 0f));
				GraphicsPath graphicsPath2 = new GraphicsPath();
				GraphicsPath graphicsPath3 = new GraphicsPath();
				int num6 = -6;
				do
				{
					graphicsPath2.StartFigure();
					graphicsPath2.AddLine(new PointF(Xmin, num6 * 5), new PointF(Xmax, num6 * 5));
					num6++;
				}
				while (num6 <= -1);
				int num7 = 1;
				do
				{
					graphicsPath2.StartFigure();
					graphicsPath2.AddLine(new PointF(Xmin, num7 * 5), new PointF(Xmax, num7 * 5));
					num7++;
				}
				while (num7 <= 6);
				float xmin = Xmin;
				float xmax = Xmax;
				for (float num8 = xmin; num8 <= xmax; num8 += 1f)
				{
					if (Math.IEEERemainder(num8, muestras_segundo) == 0.0)
					{
						graphicsPath3.StartFigure();
						graphicsPath3.AddLine(new PointF(num8, num3), new PointF(num8, 0f - num3));
					}
				}
				GraphicsPath graphicsPath4 = new GraphicsPath();
				GraphicsPath graphicsPath5 = new GraphicsPath();
				GraphicsPath graphicsPath6 = new GraphicsPath();
				GraphicsPath graphicsPath7 = new GraphicsPath();
				GraphicsPath graphicsPath8 = new GraphicsPath();
				GraphicsPath graphicsPath9 = new GraphicsPath();
				GraphicsPath graphicsPath10 = new GraphicsPath();
				new GraphicsPath();
				GraphicsPath graphicsPath11 = new GraphicsPath();
				GraphicsPath graphicsPath12 = new GraphicsPath();
				GraphicsPath graphicsPath13 = new GraphicsPath();
				graphics.SmoothingMode = calidad;
				if (datos_cargados)
				{
					float num9 = 0f;
					float y = 0f;
					float y2 = 0f;
					float y3 = 0f;
					float y4 = 0f;
					float y5 = 0f;
					float y6 = 0f;
					float y7 = 0f;
					float xmin2 = Xmin;
					float xmax2 = Xmax;
					for (float num10 = xmin2; num10 <= xmax2; num10 += 1f)
					{
						float num11;
						float num12;
						float num13;
						float num14;
						float num15;
						float num16;
						float num17;
						float num18;
						float num19;
						float num20;
						if (CheckBox5.Checked)
						{
							num11 = num10;
							num12 = Registro[1, (int)Math.Round(num10)] * -1f;
							num13 = Registro[2, (int)Math.Round(num10)];
							num14 = Registro[11, (int)Math.Round(num10)];
							num15 = Registro[14, (int)Math.Round(num10)];
							num16 = Registro[13, (int)Math.Round(num10)] * 25f;
							num17 = Registro[8, (int)Math.Round(num10)];
							num18 = Registro[23, (int)Math.Round(num10)] * -1f;
							num19 = Registro[16, (int)Math.Round(num10)];
							num20 = Registro[24, (int)Math.Round(num10)];
						}
						else
						{
							num11 = num10;
							num12 = Registro[1, (int)Math.Round(num10)];
							num13 = Registro[2, (int)Math.Round(num10)];
							num14 = Registro[11, (int)Math.Round(num10)];
							num15 = Registro[14, (int)Math.Round(num10)];
							num16 = Registro[13, (int)Math.Round(num10)] * 25f;
							num17 = Registro[8, (int)Math.Round(num10)];
							num18 = Registro[23, (int)Math.Round(num10)];
							num19 = Registro[16, (int)Math.Round(num10)];
							num20 = Registro[24, (int)Math.Round(num10)];
						}
						if (CheckBox3.Checked)
						{
							graphicsPath4.AddLine(num9, y, num11, num12);
							graphicsPath8.AddLine(num9, y7, num11, num20);
						}
						graphicsPath7.AddLine(num9, y6, num11, num18);
						graphicsPath5.AddLine(num9, y2, num11, num13);
						graphicsPath6.AddLine(num9, y3, num11, num14);
						graphicsPath9.AddLine(num9, y5, num11, num17);
						if (num16 > 0f)
						{
							Rectangle rect = new Rectangle((int)Math.Round(num9), 0, (int)Math.Round(num11 - num9), (int)Math.Round(num16));
							graphicsPath11.AddRectangle(rect);
							graphicsPath12.AddRectangle(rect);
						}
						if (num19 == 0f)
						{
							Rectangle rect2 = new Rectangle((int)Math.Round(num9), (int)Math.Round(num2), (int)Math.Round(num11 - num9), (int)Math.Round(2f * num));
							graphicsPath13.AddRectangle(rect2);
						}
						graphicsPath10.AddLine(num9, y4, num11, num15);
						num9 = num11;
						y = num12;
						y2 = num13;
						y3 = num14;
						y4 = num15;
						y5 = num17;
						y6 = num18;
						y7 = num20;
					}
				}
				if (ComboBox2.SelectedIndex == 1)
				{
					GraphicsPath graphicsPath14 = new GraphicsPath();
					Rectangle rect3 = new Rectangle((int)Math.Round(Xmin), (int)Math.Round(num2), (int)Math.Round(Xmax - Xmin), (int)Math.Round(2f * num));
					graphicsPath14.AddRectangle(rect3);
					graphicsPath14.Transform(matriz);
					Region region = new Region(graphicsPath14);
					LinearGradientBrush brush = new LinearGradientBrush(new PointF(0f, 0f), new PointF(0f, PictureBox1.Height), Color.White, Color.WhiteSmoke);
					graphics.FillRegion(brush, region);
				}
				if (datos_cargados)
				{
					graphicsPath13.Transform(matriz2);
					Region region2 = new Region(graphicsPath13);
					LinearGradientBrush brush2 = new LinearGradientBrush(new PointF(0f, 0f), new PointF(0f, (float)((double)(3 * PictureBox1.Height) / 2.0)), Color.DarkGray, Color.Black);
					graphics.FillRegion(brush2, region2);
					if (CheckBox2.Checked)
					{
						graphicsPath12.Transform(matriz3);
						graphics.DrawPath(lapiz_alarma, graphicsPath12);
						Region region3 = new Region(graphicsPath12);
						graphics.FillRegion(Brushes.Orange, region3);
						graphicsPath11.Transform(matriz3);
						graphics.DrawPath(lapiz_alarma, graphicsPath11);
					}
				}
				graphicsPath2.Transform(matriz);
				lapiz_ejes_secun_hor.DashStyle = DashStyle.Custom;
				lapiz_ejes_secun_hor.DashPattern = new float[4] { 1f, 3f, 1f, 3f };
				graphics.DrawPath(lapiz_ejes_secun_hor, graphicsPath2);
				graphicsPath3.Transform(matriz);
				graphics.DrawPath(lapiz_ejes_secun_vert, graphicsPath3);
				graphicsPath.Transform(matriz);
				graphics.DrawPath(Lapiz_ejes, graphicsPath);
				if (datos_cargados)
				{
					if (CheckBox9.Checked)
					{
						GraphicsPath graphicsPath15 = new GraphicsPath();
						graphicsPath15.AddLine(Xmin, Conversions.ToSingle(TextBox9.Text), Xmax, Conversions.ToSingle(TextBox9.Text));
						graphicsPath15.Transform(matriz2);
						graphics.DrawPath(lapiz2, graphicsPath15);
						GraphicsPath graphicsPath16 = new GraphicsPath();
						graphicsPath16.AddLine(Xmin, 0f - Conversions.ToSingle(TextBox9.Text), Xmax, 0f - Conversions.ToSingle(TextBox9.Text));
						graphicsPath16.Transform(matriz2);
						graphics.DrawPath(lapiz2, graphicsPath16);
					}
					if (CheckBox4.Checked)
					{
						graphicsPath10.Transform(matriz3);
						graphics.DrawPath(lapiz_vel, graphicsPath10);
					}
					graphicsPath5.Transform(matriz2);
					graphicsPath6.Transform(matriz3);
					graphicsPath9.Transform(matriz_giro);
					graphics.DrawPath(lapiz_4, graphicsPath9);
					graphics.DrawPath(lapiz2, graphicsPath5);
					graphics.DrawPath(lapiz3, graphicsPath6);
					graphicsPath7.Transform(matriz2);
					graphics.DrawPath(lapiz1, graphicsPath7);
					if (CheckBox3.Checked)
					{
						graphicsPath4.Transform(matriz2);
						graphics.DrawPath(lapizfiltro1, graphicsPath4);
						graphicsPath8.Transform(matriz3);
						graphics.DrawPath(lapizfiltro3, graphicsPath8);
					}
					TextBox7.Text = Hora[0, (int)Math.Round(Xmin)];
					TextBox8.Text = Hora[0, (int)Math.Round(Xmax)];
				}
				if (indicador)
				{
					graphics.DrawLine(Lapiz_ejes, x1i, y1i, x2i, y2i);
					float num21 = Xmin + (float)x1i / (FactorescalaejeX * ((float)PictureBox1.Width + ValorminimoejeX) / (Xmax - Xmin));
					x1_int = (int)Math.Round(Math.Truncate(num21) + 1.0);
					try
					{
						TextBox15.Text = Conversions.ToString(Math.Round(100f * Registro[1, x1_int]) / 100.0);
						TextBox16.Text = Conversions.ToString(Math.Round(100f * Registro[2, x1_int]) / 100.0);
						TextBox10.Text = Conversions.ToString(Math.Round(100f * Registro[8, x1_int]) / 100.0);
						TextBox6.Text = Conversions.ToString(Math.Round(100f * Registro[11, x1_int]) / 100.0);
						TextBox11.Text = Conversions.ToString(Registro[13, x1_int]);
						if (Registro[17, x1_int] == 0f)
						{
							TextBox9.Text = Conversions.ToString(90f - C1);
						}
						else
						{
							TextBox9.Text = Conversions.ToString(90f - C2);
						}
						if ((double)Registro[16, x1_int] == Conversions.ToDouble("1"))
						{
							Label22.Visible = false;
						}
						else
						{
							Label22.Visible = true;
						}
						if ((double)Registro[15, x1_int] == Conversions.ToDouble("0"))
						{
							Label43.Visible = false;
						}
						Label35.Text = Conversions.ToString(Registro[17, x1_int] + 1f);
						if (Registro[17, x1_int] == 1f)
						{
							Label36.Text = RM.GetString("masrestrictivo");
						}
						else
						{
							Label36.Text = RM.GetString("menosrestrictivo");
						}
						TextBox13.Text = Conversions.ToString(Math.Round(10f * Registro[14, x1_int]) / 10.0);
						ProgressBar1.Value = (int)Math.Floor(Conversions.ToSingle(TextBox13.Text));
						if (avanzado)
						{
							TextBox29.Text = Conversions.ToString(Math.Round(100f * Registro[10, x1_int]) / 100.0);
							TextBox1.Text = Conversions.ToString(Math.Round(100f * Registro[3, x1_int]) / 100.0);
							TextBox18.Text = Conversions.ToString(Math.Round(100f * Registro[4, x1_int]) / 100.0);
							TextBox19.Text = Conversions.ToString(Math.Round(100f * Registro[5, x1_int]) / 100.0);
							TextBox20.Text = Conversions.ToString(Math.Round(100f * Registro[6, x1_int]) / 100.0);
							TextBox21.Text = Conversions.ToString(Math.Round(100f * Registro[7, x1_int]) / 100.0);
							TextBox22.Text = Conversions.ToString(Math.Round(100f * Registro[8, x1_int]) / 100.0);
						}
						gx = (float)(Math.Round(100f * Registro[3, x1_int]) / 100.0);
						gy = (float)(Math.Round(100f * Registro[4, x1_int]) / 100.0);
						TextBox5.Text = Conversions.ToString(Registro[21, x1_int]);
						TextBox12.Text = Conversions.ToString(Registro[22, x1_int]);
						int num22 = (int)Math.Round(String_a_Numero(Conversions.ToString(Registro[1, x1_int])));
						switch (Math.Abs(num22))
						{
						case 0:
							PictureBox5.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Frontal_0.jpg");
							break;
						case 1:
							PictureBox5.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Frontal_1.jpg");
							break;
						case 2:
							PictureBox5.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Frontal_2.jpg");
							break;
						case 3:
							PictureBox5.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Frontal_3.jpg");
							break;
						case 4:
							PictureBox5.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Frontal_4.jpg");
							break;
						case 5:
							PictureBox5.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Frontal_5.jpg");
							break;
						case 6:
							PictureBox5.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Frontal_6.jpg");
							break;
						case 7:
							PictureBox5.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Frontal_7.jpg");
							break;
						case 8:
							PictureBox5.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Frontal_8.jpg");
							break;
						case 9:
							PictureBox5.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Frontal_9.jpg");
							break;
						case 10:
							PictureBox5.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Frontal_10.jpg");
							break;
						case 11:
							PictureBox5.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Frontal_11.jpg");
							break;
						case 12:
							PictureBox5.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Frontal_12.jpg");
							break;
						case 13:
							PictureBox5.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Frontal_13.jpg");
							break;
						case 14:
							PictureBox5.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Frontal_14.jpg");
							break;
						case 15:
							PictureBox5.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Frontal_15.jpg");
							break;
						case 16:
							PictureBox5.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Frontal_16.jpg");
							break;
						case 17:
							PictureBox5.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Frontal_17.jpg");
							break;
						case 18:
							PictureBox5.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Frontal_18.jpg");
							break;
						case 19:
							PictureBox5.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Frontal_19.jpg");
							break;
						case 20:
							PictureBox5.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Frontal_20.jpg");
							break;
						case 21:
							PictureBox5.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Frontal_21.jpg");
							break;
						case 22:
							PictureBox5.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Frontal_22.jpg");
							break;
						case 23:
							PictureBox5.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Frontal_23.jpg");
							break;
						case 24:
							PictureBox5.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Frontal_24.jpg");
							break;
						case 25:
							PictureBox5.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Frontal_25.jpg");
							break;
						case 26:
							PictureBox5.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Frontal_26.jpg");
							break;
						case 27:
							PictureBox5.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Frontal_27.jpg");
							break;
						case 28:
							PictureBox5.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Frontal_28.jpg");
							break;
						case 29:
							PictureBox5.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Frontal_29.jpg");
							break;
						case 30:
							PictureBox5.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Frontal_30.jpg");
							break;
						}
						if (num22 <= 0)
						{
							PictureBox5.Image.RotateFlip(RotateFlipType.RotateNoneFlipNone);
						}
						else
						{
							PictureBox5.Image.RotateFlip(RotateFlipType.RotateNoneFlipX);
						}
						if (Registro[11, x1_int] > 40f)
						{
							PictureBox5.BackColor = Color.White;
						}
						else if (Registro[11, x1_int] > 20f)
						{
							PictureBox5.BackColor = Color.Yellow;
						}
						else
						{
							PictureBox5.BackColor = Color.Red;
						}
						int num23 = (int)Math.Round(String_a_Numero(Conversions.ToString(Registro[2, x1_int])));
						if (Math.Abs(num23) <= 2)
						{
							PictureBox6.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Lateral_0.jpg");
						}
						else if (Math.Abs(num23) <= 4)
						{
							if (num23 >= 0)
							{
								PictureBox6.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Lateral_2n.jpg");
							}
							else
							{
								PictureBox6.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Lateral_2.jpg");
							}
						}
						else if (Math.Abs(num23) <= 6)
						{
							if (num23 >= 0)
							{
								PictureBox6.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Lateral_4n.jpg");
							}
							else
							{
								PictureBox6.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Lateral_4.jpg");
							}
						}
						else if (Math.Abs(num23) <= 8)
						{
							if (num23 >= 0)
							{
								PictureBox6.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Lateral_6n.jpg");
							}
							else
							{
								PictureBox6.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Lateral_6.jpg");
							}
						}
						else if (Math.Abs(num23) <= 10)
						{
							if (num23 >= 0)
							{
								PictureBox6.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Lateral_8n.jpg");
							}
							else
							{
								PictureBox6.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Lateral_8.jpg");
							}
						}
						else if (Math.Abs(num23) <= 12)
						{
							if (num23 >= 0)
							{
								PictureBox6.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Lateral_10n.jpg");
							}
							else
							{
								PictureBox6.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Lateral_10.jpg");
							}
						}
						else if (Math.Abs(num23) <= 14)
						{
							if (num23 >= 0)
							{
								PictureBox6.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Lateral_12n.jpg");
							}
							else
							{
								PictureBox6.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Lateral_12.jpg");
							}
						}
						else if (Math.Abs(num23) <= 16)
						{
							if (num23 >= 0)
							{
								PictureBox6.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Lateral_14n.jpg");
							}
							else
							{
								PictureBox6.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Lateral_14.jpg");
							}
						}
						else if (Math.Abs(num23) <= 18)
						{
							if (num23 >= 0)
							{
								PictureBox6.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Lateral_16n.jpg");
							}
							else
							{
								PictureBox6.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Lateral_16.jpg");
							}
						}
						else if (Math.Abs(num23) <= 20)
						{
							if (num23 >= 0)
							{
								PictureBox6.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Lateral_18n.jpg");
							}
							else
							{
								PictureBox6.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Lateral_18.jpg");
							}
						}
						else if (Math.Abs(num23) <= 22)
						{
							if (num23 >= 0)
							{
								PictureBox6.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Lateral_20n.jpg");
							}
							else
							{
								PictureBox6.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Lateral_20.jpg");
							}
						}
						else if (Math.Abs(num23) <= 24)
						{
							if (num23 >= 0)
							{
								PictureBox6.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Lateral_22n.jpg");
							}
							else
							{
								PictureBox6.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Lateral_22.jpg");
							}
						}
						else if (Math.Abs(num23) <= 26)
						{
							if (num23 >= 0)
							{
								PictureBox6.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Lateral_24n.jpg");
							}
							else
							{
								PictureBox6.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Lateral_24.jpg");
							}
						}
						else if (Math.Abs(num23) <= 28)
						{
							if (num23 >= 0)
							{
								PictureBox6.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Lateral_26n.jpg");
							}
							else
							{
								PictureBox6.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Lateral_26.jpg");
							}
						}
						else if (Math.Abs(num23) <= 30)
						{
							if (num23 >= 0)
							{
								PictureBox6.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Lateral_28n.jpg");
							}
							else
							{
								PictureBox6.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Lateral_28.jpg");
							}
						}
						else if (num23 >= 0)
						{
							PictureBox6.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Lateral_30n.jpg");
						}
						else
						{
							PictureBox6.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Lateral_30.jpg");
						}
						float num24 = (float)(Math.Round(10f * Registro[8, x1_int]) / 10.0);
						float num25 = (float)(Math.Round(10f * Registro[14, x1_int]) / 10.0);
						float num26 = (float)(Math.Round(10.0 * ((double)num25 / 3.6 / ((double)num24 * Math.PI / 180.0))) / 10.0);
						if (num24 < -5f)
						{
							PictureBox7.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Vertical_dcha_220T.jpg");
						}
						else if (num24 < 5f)
						{
							PictureBox7.Image = Image.FromFile(Application.StartupPath + "\\Resources\\vertical_220t.jpg");
						}
						else
						{
							PictureBox7.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Vertical_izqda_220T.jpg");
						}
						Label38.Text = Conversions.ToString(num24);
						if (Math.Abs(num26) < 1000f)
						{
							Label41.Text = Conversions.ToString(num26);
						}
						else
						{
							Label41.Text = "-";
						}
					}
					catch (Exception ex)
					{
						ProjectData.SetProjectError(ex);
						Exception ex2 = ex;
						TextBox15.Text = "";
						TextBox11.Text = "";
						TextBox16.Text = "";
						TextBox13.Text = "";
						ProjectData.ClearProjectError();
					}
				}
				if (botonderechopulsado)
				{
					graphics.DrawLine(Pens.Yellow, x1d, y1d, x2d, y2d);
				}
			}
			catch (Exception ex3)
			{
				ProjectData.SetProjectError(ex3);
				Exception ex4 = ex3;
				MessageBox.Show(ex4.Message);
				ProjectData.ClearProjectError();
			}
		}
	}

	private void PictureBox2_Paint(object sender, PaintEventArgs e)
	{
		Graphics graphics = e.Graphics;
		graphics.Clear(PictureBox2.BackColor);
		checked
		{
			int num = (int)Math.Round(Registro[12, x1_int]);
			if (CheckBox5.Checked)
			{
				num = ((num == 0) ? 1 : 0);
			}
			float num2 = 2f;
			float num3 = -2f;
			float num4 = 60f;
			float num5 = 0f;
			float num6 = Math.Max(Math.Abs(num2), Math.Abs(num3));
			Math.Max(Math.Abs(num5), Math.Abs(num4));
			EscalaX = FactorescalaejeX * (float)PictureBox2.Width / (num4 - num5);
			matriz = new Matrix();
			matriz2 = new Matrix();
			matriz.Scale(EscalaX, -1f * FactorescalaejeY * (float)PictureBox2.Height / (2f * num6));
			matriz2.Scale(EscalaX, -1f * FactorescalaejeY * (float)PictureBox2.Height / (2f * num6));
			matriz.Translate(0f - num5, (float)((double)(-PictureBox2.Height) / 2.0 / (double)(FactorescalaejeY * (float)PictureBox2.Height / (2f * num6))));
			matriz2.Translate(0f - num5, (float)((double)(-PictureBox2.Height) / 2.0 / (double)(FactorescalaejeY * (float)PictureBox2.Height / (2f * num6))));
			GraphicsPath graphicsPath = new GraphicsPath();
			graphicsPath.AddLine(new PointF(30f, num3), new PointF(30f, num2));
			GraphicsPath graphicsPath2 = new GraphicsPath();
			int num7 = 1;
			do
			{
				graphicsPath2.StartFigure();
				graphicsPath2.AddLine(new PointF(num7, num3), new PointF(num7, num2));
				num7++;
			}
			while (num7 <= 60);
			if (indicador)
			{
				if (Registro[11, x1_int] <= 60f)
				{
					ficher = (int)Math.Round(Registro[11, x1_int] * 30f / 60f);
					ficher = 30 - ficher;
				}
				else
				{
					ficher = 0;
				}
			}
			if (!datos_cargados)
			{
				ficher = 0;
			}
			PictureBox[] array = new PictureBox[6] { PictureBox10, PictureBox11, PictureBox12, PictureBox13, PictureBox14, PictureBox15 };
			if (reproducir == 1)
			{
				if (ficher > ficher_ant)
				{
					contador_display = 0;
					GraphicsPath graphicsPath3 = new GraphicsPath();
					GraphicsPath graphicsPath4 = new GraphicsPath();
					GraphicsPath graphicsPath5 = new GraphicsPath();
					int num8 = ficher;
					int num9 = ficher;
					int num10 = ficher;
					if (num8 > 15)
					{
						num8 = 15;
					}
					if (num9 > 20)
					{
						num9 = 20;
					}
					Rectangle rect = ((num != 1) ? new Rectangle(30 - num8, (int)Math.Round(num3), num8, (int)Math.Round(2f * num2)) : new Rectangle(30, (int)Math.Round(num3), num8, (int)Math.Round(2f * num2)));
					graphicsPath3.AddRectangle(rect);
					graphicsPath3.Transform(matriz2);
					Region region = new Region(graphicsPath3);
					graphics.FillRegion(Brushes.Green, region);
					rect = ((num != 1) ? new Rectangle(30 - num9, (int)Math.Round(num3), num9 - num8, (int)Math.Round(2f * num2)) : new Rectangle(30 + num8, (int)Math.Round(num3), num9 - num8, (int)Math.Round(2f * num2)));
					graphicsPath4.AddRectangle(rect);
					graphicsPath4.Transform(matriz2);
					Region region2 = new Region(graphicsPath4);
					graphics.FillRegion(Brushes.Orange, region2);
					rect = ((num != 1) ? new Rectangle(30 - num10, (int)Math.Round(num3), num10 - num9, (int)Math.Round(2f * num2)) : new Rectangle(30 + num9, (int)Math.Round(num3), num10 - num9, (int)Math.Round(2f * num2)));
					graphicsPath5.AddRectangle(rect);
					graphicsPath5.Transform(matriz2);
					Region region3 = new Region(graphicsPath5);
					graphics.FillRegion(Brushes.Red, region3);
				}
				else
				{
					if (contador_display <= 15)
					{
						contador_display++;
						ficher = ficher_ant;
					}
					GraphicsPath graphicsPath6 = new GraphicsPath();
					GraphicsPath graphicsPath7 = new GraphicsPath();
					GraphicsPath graphicsPath8 = new GraphicsPath();
					int num8 = ficher;
					int num9 = ficher;
					int num10 = ficher;
					if (num8 > 15)
					{
						num8 = 15;
					}
					if (num9 > 20)
					{
						num9 = 20;
					}
					Rectangle rect2 = ((num != 1) ? new Rectangle(30 - num8, (int)Math.Round(num3), num8, (int)Math.Round(2f * num2)) : new Rectangle(30, (int)Math.Round(num3), num8, (int)Math.Round(2f * num2)));
					graphicsPath6.AddRectangle(rect2);
					graphicsPath6.Transform(matriz2);
					Region region4 = new Region(graphicsPath6);
					graphics.FillRegion(Brushes.Green, region4);
					rect2 = ((num != 1) ? new Rectangle(30 - num9, (int)Math.Round(num3), num9 - num8, (int)Math.Round(2f * num2)) : new Rectangle(30 + num8, (int)Math.Round(num3), num9 - num8, (int)Math.Round(2f * num2)));
					graphicsPath7.AddRectangle(rect2);
					graphicsPath7.Transform(matriz2);
					Region region5 = new Region(graphicsPath7);
					graphics.FillRegion(Brushes.Orange, region5);
					rect2 = ((num != 1) ? new Rectangle(30 - num10, (int)Math.Round(num3), num10 - num9, (int)Math.Round(2f * num2)) : new Rectangle(30 + num9, (int)Math.Round(num3), num10 - num9, (int)Math.Round(2f * num2)));
					graphicsPath8.AddRectangle(rect2);
					graphicsPath8.Transform(matriz2);
					Region region6 = new Region(graphicsPath8);
					graphics.FillRegion(Brushes.Red, region6);
				}
			}
			else
			{
				GraphicsPath graphicsPath9 = new GraphicsPath();
				GraphicsPath graphicsPath10 = new GraphicsPath();
				GraphicsPath graphicsPath11 = new GraphicsPath();
				int num8 = ficher;
				int num9 = ficher;
				int num10 = ficher;
				if (num8 > 15)
				{
					num8 = 15;
				}
				if (num9 > 20)
				{
					num9 = 20;
				}
				Rectangle rect3 = ((num != 1) ? new Rectangle(30 - num8, (int)Math.Round(num3), num8, (int)Math.Round(2f * num2)) : new Rectangle(30, (int)Math.Round(num3), num8, (int)Math.Round(2f * num2)));
				graphicsPath9.AddRectangle(rect3);
				graphicsPath9.Transform(matriz2);
				Region region7 = new Region(graphicsPath9);
				graphics.FillRegion(Brushes.Green, region7);
				rect3 = ((num != 1) ? new Rectangle(30 - num9, (int)Math.Round(num3), num9 - num8, (int)Math.Round(2f * num2)) : new Rectangle(30 + num8, (int)Math.Round(num3), num9 - num8, (int)Math.Round(2f * num2)));
				graphicsPath10.AddRectangle(rect3);
				graphicsPath10.Transform(matriz2);
				Region region8 = new Region(graphicsPath10);
				graphics.FillRegion(Brushes.Orange, region8);
				rect3 = ((num != 1) ? new Rectangle(30 - num10, (int)Math.Round(num3), num10 - num9, (int)Math.Round(2f * num2)) : new Rectangle(30 + num9, (int)Math.Round(num3), num10 - num9, (int)Math.Round(2f * num2)));
				graphicsPath11.AddRectangle(rect3);
				graphicsPath11.Transform(matriz2);
				Region region9 = new Region(graphicsPath11);
				graphics.FillRegion(Brushes.Red, region9);
			}
			graphics.SmoothingMode = calidad;
			graphicsPath2.Transform(matriz);
			graphics.DrawPath(lapiz_ejes_secun_display, graphicsPath2);
			graphicsPath.Transform(matriz);
			graphics.DrawPath(Lapiz_ejes_display, graphicsPath);
			int num11 = 0;
			do
			{
				if ((double)ficher / 5.0 > (double)num11)
				{
					if (num11 > 3)
					{
						array[num11].Image = Resources.red_ball;
					}
					else if (num11 > 1)
					{
						array[num11].Image = Resources.orange_ball;
					}
					else
					{
						array[num11].Image = Resources.yellow_ball;
					}
				}
				else
				{
					array[num11].Image = Resources.grey_ball;
				}
				num11++;
			}
			while (num11 <= 5);
			ficher_ant = ficher;
		}
	}

	private void Form1_FormClosing(object sender, FormClosingEventArgs e)
	{
		MyProject.Forms.Principal.Visible = true;
	}

	private void Form1_Load(object sender, EventArgs e)
	{
		PictureBox5.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Frontal_0.jpg");
		PictureBox6.Image = Image.FromFile(Application.StartupPath + "\\Resources\\Lateral_0.jpg");
		PictureBox7.Image = Image.FromFile(Application.StartupPath + "\\Resources\\vertical_220t.jpg");
		RGTableAdapter.Fill(VehiculosDataSet.RG);
		DescargasTableAdapter.Fill(DatosDataSet.Descargas);
		if (DescargasBindingSource.Count != 0)
		{
			DescargasBindingSource.Position = 0;
		}
		if (RGBindingSource.Count != 0)
		{
			RGBindingSource.Position = 0;
		}
		actualizar_uco();
		actualizar_lista();
		RadioButton2.Checked = true;
		Size_adjust();
		Button7.Enabled = false;
		Button9.Enabled = false;
		Button1.Enabled = false;
		if (MyProject.Forms.Principal.user > 1)
		{
			Button14.Enabled = false;
		}
		Label35.Text = "";
		Label36.Text = "";
		if (MyProject.Forms.Principal.user == 2)
		{
			RadioButton1.Checked = true;
			RadioButton1.Visible = false;
			RadioButton2.Visible = false;
			ComboBox2.SelectedIndex = 0;
		}
		else
		{
			RadioButton2.Checked = true;
			ComboBox2.SelectedIndex = 1;
		}
		Dibujar();
		ListBox1.SelectedIndex = -1;
		ListBox1.SelectedIndex = 0;
	}

	private void actualizar_lista()
	{
		int count = RGBindingSource.Count;
		if (count == 0)
		{
			ListBox1.Items.Clear();
			return;
		}
		ListBox1.Items.Clear();
		checked
		{
			if (Operators.ConditionalCompareObjectEqual(ComboBox1.SelectedItem, RM.GetString("todos"), TextCompare: false))
			{
				int num = count - 1;
				for (int i = 0; i <= num; i++)
				{
					RGBindingSource.Position = i;
					ListBox1.Items.Add(VehiculosDataSet.RG[RGBindingSource.Position].Matricula);
				}
				ListBox1.SelectedIndex = 0;
				return;
			}
			string filterExpression = "Num_Identificacion like '" + Conversions.ToString(ComboBox1.SelectedItem) + "'";
			Lista_UCO = VehiculosDataSet.RG.Select(filterExpression);
			int num2 = Lista_UCO.Length - 1;
			for (int j = 0; j <= num2; j++)
			{
				ListBox1.Items.Add(Conversions.ToString(Lista_UCO[j][3]));
			}
			ListBox1.SelectedIndex = 0;
		}
	}

	private void actualizar_Fechas()
	{
		matricula = Conversions.ToString(ListBox1.SelectedItem);
		string filterExpression = "Id_RG like '" + matricula + "'";
		Lista_Fechas = DatosDataSet.Descargas.Select(filterExpression);
		if (Lista_Fechas.GetUpperBound(0) == -1)
		{
			MonthCalendar1.RemoveAllBoldedDates();
			MonthCalendar1.UpdateBoldedDates();
			return;
		}
		MonthCalendar1.RemoveAllBoldedDates();
		int upperBound = Lista_Fechas.GetUpperBound(0);
		for (int i = 0; i <= upperBound; i = checked(i + 1))
		{
			string value = Conversions.ToString(Lista_Fechas[i][6]);
			Thread.CurrentThread.CurrentCulture = new CultureInfo("es-ES");
			DateTime date = Conversions.ToDate(value);
			MonthCalendar1.AddBoldedDate(date);
		}
		MonthCalendar1.UpdateBoldedDates();
		string name = MySettingsProperty.Settings.idioma;
		Thread.CurrentThread.CurrentCulture = new CultureInfo(name);
	}

	private void actualizar_Archivos()
	{
		string num_Identificacion = VehiculosDataSet.RG[RGBindingSource.Position].Num_Identificacion;
		Thread.CurrentThread.CurrentCulture = new CultureInfo("es-ES");
		string[] array = Strings.Split(Conversions.ToString(MonthCalendar1.SelectionStart.Date), "/", -1, CompareMethod.Text);
		string text = array[0] + "-" + array[1] + "-" + array[2];
		_ = array[2];
		string text2 = num_Identificacion;
		if (text2.Length == 1)
		{
			text2 = "000" + text2;
		}
		else if (text2.Length == 2)
		{
			text2 = "00" + text2;
		}
		else if (text2.Length == 3)
		{
			text2 = "0" + text2;
		}
		string filterExpression = "ID_RG like '" + num_Identificacion + "' AND Fecha like '" + text + "'";
		lista_Fechas_archivos = DatosDataSet.Descargas.Select(filterExpression);
		if (lista_Fechas_archivos.GetUpperBound(0) == -1)
		{
			ListBox2.Items.Clear();
			ListBox2.Items.Add(RM.GetString("sindatos"));
		}
		else
		{
			ListBox2.Items.Clear();
			int upperBound = lista_Fechas_archivos.GetUpperBound(0);
			for (int i = 0; i <= upperBound; i = checked(i + 1))
			{
				string item = Conversions.ToString(Operators.ConcatenateObject(RM.GetString("horainicio") + " - ", lista_Fechas_archivos[i][7]));
				ListBox2.Items.Add(item);
			}
		}
		_ = MySettingsProperty.Settings.idioma;
	}

	private void Button3_Click(object sender, EventArgs e)
	{
		if (Xmax > 100f)
		{
			if (Control.ModifierKeys == Keys.Shift)
			{
				Xmax -= 100f;
				Xmin += 100f;
			}
			else
			{
				Xmax -= 10f;
				Xmin += 10f;
			}
			if (Xmax - Xmin < 100f)
			{
				Xmax = Xmaxanterior;
				Xmin = Xminanterior;
			}
			Xmaxanterior = Xmax;
			Xminanterior = Xmin;
			actualizarbarra();
			Dibujar();
		}
	}

	private void Button4_Click(object sender, EventArgs e)
	{
		checked
		{
			if (Xmax < (float)(NUMEROREGISTROS - 100))
			{
				if (Control.ModifierKeys == Keys.Shift)
				{
					Xmax += 100f;
					Xmin -= 100f;
				}
				else
				{
					Xmax += 10f;
					Xmin -= 10f;
				}
				if (Control.ModifierKeys == Keys.Control)
				{
					Xmax = NUMEROREGISTROS - 100;
					Xmin = ValorminimoejeX;
				}
				if ((Xmax > (float)(NUMEROREGISTROS - 99)) | (Xmin < ValorminimoejeX))
				{
					Xmax = Xmaxanterior;
					Xmin = Xminanterior;
				}
				Xmaxanterior = Xmax;
				Xminanterior = Xmin;
				actualizarbarra();
				Dibujar();
			}
		}
	}

	private void Button8_Click(object sender, EventArgs e)
	{
		float num = (Xminanterior + Xmaxanterior) / 2f;
		checked
		{
			float num2 = ((NUMEROREGISTROS - 1 <= 600) ? ((float)(NUMEROREGISTROS - 1)) : 600f);
			float num3 = num2 - ValorminimoejeX;
			Xmax = num + num3 / 2f;
			Xmin = num - num3 / 2f;
			if ((Xmax > (float)(NUMEROREGISTROS - 99)) | (Xmin < ValorminimoejeX))
			{
				Xmax = Xmaxanterior;
				Xmin = Xminanterior;
			}
			if (Xmax - Xmin < 100f)
			{
				Xmax = Xmaxanterior;
				Xmin = Xminanterior;
			}
			Xmaxanterior = Xmax;
			Xminanterior = Xmin;
			Dibujar();
		}
	}

	private void HScrollBar1_Scroll(object sender, ScrollEventArgs e)
	{
	}

	private void CheckBox9_CheckedChanged(object sender, EventArgs e)
	{
		Dibujar();
	}

	private void CheckBox10_CheckedChanged(object sender, EventArgs e)
	{
		Dibujar();
	}

	private void Button2_Click(object sender, EventArgs e)
	{
		MyProject.Forms.Exportar.Show();
	}

	private void ListBox1_SelectedIndexChanged(object sender, EventArgs e)
	{
		if (!(Cursor == Cursors.WaitCursor))
		{
			actualizar_Fechas();
			actualizar_Archivos();
		}
	}

	private void Button5_Click(object sender, EventArgs e)
	{
		Close();
	}

	private void Size_adjust()
	{
		int num = base.Height;
		int num2 = base.Width;
		int num3 = 5;
		int num4 = 75;
		int num5 = HScrollBar1.Height;
		checked
		{
			_ = num2 - PictureBox1.Location.X;
			int num6 = num - PictureBox1.Location.Y - num4;
			int num7 = base.Width - PictureBox1.Location.X - GroupBox11.Width - 6 * num3;
			int num8 = (int)Math.Round(Math.Round((double)(60 * num6) / 100.0) - (double)num5);
			int num9 = (int)Math.Round((double)num7 / 2.0);
			int num10 = num6 - num8 - num3;
			_ = num6 - num3 - Button5.Height;
			PictureBox1.Width = num7 - 2 * num3;
			PictureBox1.Height = num8 - num3;
			PictureBox2.Width = PictureBox1.Width;
			HScrollBar1.Location = new Point(PictureBox1.Location.X, PictureBox1.Location.Y + PictureBox1.Height);
			HScrollBar1.Width = PictureBox1.Width;
			GroupBox11.Location = new Point(PictureBox1.Location.X + PictureBox1.Width + num3, PictureBox2.Location.Y);
			Label22.Location = new Point(PictureBox1.Location.X + PictureBox1.Width - Label22.Width - num3, PictureBox1.Location.Y + num3);
			Label43.Location = new Point(PictureBox1.Location.X + PictureBox1.Width - Label43.Width - num3, PictureBox1.Location.Y + Label22.Height + 2 * num3);
			Panel8.Location = new Point((int)Math.Round((double)(PictureBox1.Location.X + PictureBox1.Width - Panel8.Width) - Math.Floor((double)num3 / 2.0)), (int)Math.Round((double)(PictureBox1.Location.Y + PictureBox1.Height - Panel8.Height) - Math.Floor((double)num3 / 2.0)));
			if (RadioButton2.Checked)
			{
				avanzado = true;
				PictureBox3.Visible = true;
				Panel2.Visible = true;
				PictureBox3.Width = num9 * 2 - 2 * num3;
				PictureBox3.Height = num10;
				PictureBox3.Location = new Point(PictureBox1.Location.X, PictureBox1.Location.Y + PictureBox1.Height + num5 + num3);
				PictureBox6.SizeMode = PictureBoxSizeMode.CenterImage;
				PictureBox5.Location = new Point((int)Math.Round((double)GroupBox11.Location.X + (double)(GroupBox11.Width - PictureBox5.Width) / 2.0), GroupBox11.Location.Y + GroupBox11.Height + num3);
				PictureBox7.Location = new Point((int)Math.Round((double)GroupBox11.Location.X + (double)(GroupBox11.Width - PictureBox7.Width) / 2.0), GroupBox11.Location.Y + GroupBox11.Height + PictureBox5.Height + 2 * num3);
				PictureBox6.Location = new Point((int)Math.Round((double)GroupBox11.Location.X + (double)(GroupBox11.Width - PictureBox6.Width) / 2.0), GroupBox11.Location.Y + GroupBox11.Height + PictureBox5.Height + PictureBox7.Height + 3 * num3);
				Panel5.Location = new Point(PictureBox7.Location.X, PictureBox7.Location.Y);
				Panel6.Location = new Point(PictureBox7.Location.X, PictureBox7.Location.Y + PictureBox7.Height - Panel6.Height);
				if (base.Height > 900)
				{
					Panel2.Location = new Point(PictureBox3.Location.X + 3 + PictureBox3.Width, PictureBox3.Location.Y + PictureBox3.Height - Panel2.Height - 3);
				}
				else
				{
					Panel2.Location = new Point(PictureBox3.Location.X + 3, PictureBox3.Location.Y + PictureBox3.Height - Panel2.Height - 3);
				}
				Button18.Location = Panel2.Location;
				GroupBox9.Location = new Point(ListBox2.Location.X, (int)Math.Round((double)(Label7.Location.Y + Label7.Height) + (double)num3 / 2.0));
				Button5.Location = new Point(GroupBox9.Location.X, GroupBox9.Location.Y + GroupBox9.Height + 5);
			}
			else
			{
				avanzado = false;
				PictureBox3.Visible = false;
				PictureBox8.Visible = false;
				PictureBox9.Visible = false;
				Panel2.Visible = false;
				int num11 = base.Height - HScrollBar1.Location.Y - HScrollBar1.Height - 120;
				float num12 = (float)((double)num11 / 150.0);
				PictureBox5.Size = new Size(num11, num11);
				PictureBox5.Location = new Point(PictureBox1.Location.X + 30, HScrollBar1.Location.Y + HScrollBar1.Height + num3);
				num12 = (float)((double)PictureBox7.Height / (double)PictureBox7.Width);
				PictureBox7.Size = new Size((int)Math.Round((float)num11 / num12), num11);
				PictureBox7.Location = new Point(PictureBox5.Location.X + PictureBox5.Width - 80, PictureBox5.Location.Y);
				PictureBox6.Location = new Point(PictureBox7.Location.X + PictureBox7.Width + num3, (int)Math.Round((double)PictureBox5.Location.Y + (double)PictureBox7.Height / 2.0 - (double)PictureBox6.Height / 2.0));
				Panel5.Location = new Point(PictureBox7.Location.X, PictureBox7.Location.Y);
				Panel6.Location = new Point(PictureBox7.Location.X, PictureBox7.Location.Y + PictureBox7.Height - Panel6.Height);
				GroupBox9.Location = new Point((int)Math.Round((double)GroupBox11.Location.X + (double)(GroupBox11.Width - GroupBox9.Width) / 2.0), GroupBox11.Location.Y + GroupBox11.Height + num3);
				Button5.Location = new Point(ListBox2.Location.X, (int)Math.Round((double)(Label7.Location.Y + Label7.Height) + (double)num3 / 2.0));
			}
			if (!avanzado)
			{
				Panel7.Visible = false;
			}
			Button2.Location = new Point(Button5.Location.X + Button5.Width + 5, Button5.Location.Y);
		}
	}

	private void MonthCalendar1_DateChanged(object sender, DateRangeEventArgs e)
	{
		actualizar_Archivos();
		_ = Cursor == Cursors.WaitCursor;
	}

	private void ListBox2_DoubleClick(object sender, EventArgs e)
	{
		if (!(Cursor == Cursors.WaitCursor))
		{
			datos_cargados = false;
			adjudicarvaloresiniciales();
			Button1.PerformClick();
		}
	}

	private void ListBox2_SelectedIndexChanged(object sender, EventArgs e)
	{
		if (!(Cursor == Cursors.WaitCursor))
		{
			if (Operators.ConditionalCompareObjectEqual(ListBox2.SelectedItem, RM.GetString("sindatos"), TextCompare: false))
			{
				Button1.Enabled = false;
			}
			else
			{
				Button1.Enabled = true;
			}
		}
	}

	private void PictureBox1_MouseDown(object sender, MouseEventArgs e)
	{
		Button9.PerformClick();
		if (e.Button == MouseButtons.Right)
		{
			indicador = false;
			botonderechopulsado = true;
			X1zoom = e.X;
			Dibujar();
			return;
		}
		indicador = true;
		botonpulsado = true;
		x1i = e.X;
		y1i = 0;
		x2i = e.X;
		y2i = PictureBox1.Height;
		if (datos_cargados)
		{
			Label14.Location = new Point(Control.MousePosition.X, Control.MousePosition.Y);
			Label14.Text = Hora[0, x1_int] + Environment.NewLine + RM.GetString("estabilidad") + Conversions.ToString(Math.Round(10f * Registro[11, x1_int]) / 10.0);
			Label14.Visible = true;
		}
		Dibujar();
	}

	private void PictureBox1_MouseMove(object sender, MouseEventArgs e)
	{
		if ((e.X < 0) | (e.X > PictureBox1.Width))
		{
			return;
		}
		if (e.Button == MouseButtons.Left)
		{
			indicador = true;
			botonpulsado = true;
			x1i = e.X;
			y1i = 0;
			x2i = e.X;
			y2i = PictureBox1.Height;
			if (datos_cargados)
			{
				Label14.Location = new Point(Control.MousePosition.X, Control.MousePosition.Y);
				Label14.Text = Hora[0, x1_int] + Environment.NewLine + RM.GetString("estabilidad") + Conversions.ToString(Math.Round(10f * Registro[11, x1_int]) / 10.0);
			}
			Dibujar();
		}
		else if (e.Button == MouseButtons.Right)
		{
			botonderechopulsado = true;
			x1d = e.X;
			y1d = 0;
			x2d = e.X;
			y2d = PictureBox1.Height;
			Dibujar();
		}
	}

	private void PictureBox1_MouseUp(object sender, MouseEventArgs e)
	{
		if (e.X > PictureBox1.Width)
		{
			X2zoom = PictureBox1.Width;
		}
		else if (e.X < 0)
		{
			X2zoom = 0;
		}
		else
		{
			X2zoom = e.X;
		}
		if (botonderechopulsado)
		{
			float num = Math.Min(X1zoom, X2zoom);
			float num2 = Math.Max(X1zoom, X2zoom);
			Xmin = (float)((double)Xminanterior + Math.Round(num / (float)PictureBox1.Width * (Xmaxanterior - Xminanterior)));
			Xmax = (float)((double)Xminanterior + Math.Round(num2 / (float)PictureBox1.Width * (Xmaxanterior - Xminanterior)));
			Xmaxanterior = Xmax;
			Xminanterior = Xmin;
			actualizarbarra();
		}
		botonpulsado = false;
		botonderechopulsado = false;
		Label14.Visible = false;
		Dibujar();
	}

	private void PictureBox3_Paint(object sender, PaintEventArgs e)
	{
		Graphics graphics = e.Graphics;
		graphics.Clear(PictureBox1.BackColor);
		float num = 2f;
		float num2 = -2f;
		float value = -1f;
		float value2 = -40f;
		float num3 = Math.Max(Math.Abs(num), Math.Abs(num2));
		float num4 = Math.Max(Math.Abs(40f), Math.Abs(value2));
		float num5 = Math.Max(Math.Abs(1f), Math.Abs(value));
		EscalaX = FactorescalaejeX * ((float)PictureBox3.Width + ValorminimoejeX) / (Xmax - Xmin);
		matriz = new Matrix();
		matriz2 = new Matrix();
		matriz3 = new Matrix();
		Matrix matrix = new Matrix();
		matriz.Scale(EscalaX, -1f * FactorescalaejeY * ((float)PictureBox3.Height + ValorminimoejeX) / (2f * num3));
		matriz2.Scale(EscalaX, -1f * FactorescalaejeY * ((float)PictureBox3.Height + ValorminimoejeX) / (2f * num3));
		matriz3.Scale(EscalaX, -1f * FactorescalaejeY * ((float)PictureBox3.Height + ValorminimoejeX) / (2f * num4));
		matrix.Scale(EscalaX, -1f * FactorescalaejeY * ((float)PictureBox3.Height + ValorminimoejeX) / (2f * num5));
		checked
		{
			matriz.Translate(0f - Xmin, (float)((double)(-PictureBox3.Height) / 2.0 / (double)(FactorescalaejeY * ((float)PictureBox3.Height + ValorminimoejeX) / (2f * num3))));
			matriz2.Translate(0f - Xmin, (float)((double)(-PictureBox3.Height) / 2.0 / (double)(FactorescalaejeY * ((float)PictureBox3.Height + ValorminimoejeX) / (2f * num3))));
			matriz3.Translate(0f - Xmin, (float)((double)(-PictureBox3.Height) / 2.0 / (double)(FactorescalaejeY * ((float)PictureBox3.Height + ValorminimoejeX) / (2f * num4))));
			matrix.Translate(0f - Xmin, (float)((double)(-PictureBox3.Height) / 2.0 / (double)(FactorescalaejeY * ((float)PictureBox3.Height + ValorminimoejeX) / (2f * num5))));
			GraphicsPath graphicsPath = new GraphicsPath();
			graphicsPath.AddLine(new PointF(Xmin, 0f), new PointF(Xmax, 0f));
			GraphicsPath graphicsPath2 = new GraphicsPath();
			GraphicsPath graphicsPath3 = new GraphicsPath();
			int num6 = -4;
			do
			{
				graphicsPath2.StartFigure();
				graphicsPath2.AddLine(new PointF(Xmin, (float)((double)num6 * 0.5)), new PointF(Xmax, (float)((double)num6 * 0.5)));
				num6++;
			}
			while (num6 <= -1);
			int num7 = 1;
			do
			{
				graphicsPath2.StartFigure();
				graphicsPath2.AddLine(new PointF(Xmin, (float)((double)num7 * 0.5)), new PointF(Xmax, (float)((double)num7 * 0.5)));
				num7++;
			}
			while (num7 <= 4);
			float xmin = Xmin;
			float xmax = Xmax;
			for (float num8 = xmin; num8 <= xmax; num8 += 1f)
			{
				if (Math.IEEERemainder(num8, muestras_segundo) == 0.0)
				{
					graphicsPath3.StartFigure();
					graphicsPath3.AddLine(new PointF(num8, num3), new PointF(num8, 0f - num3));
				}
			}
			GraphicsPath graphicsPath4 = new GraphicsPath();
			GraphicsPath graphicsPath5 = new GraphicsPath();
			GraphicsPath graphicsPath6 = new GraphicsPath();
			GraphicsPath graphicsPath7 = new GraphicsPath();
			GraphicsPath graphicsPath8 = new GraphicsPath();
			GraphicsPath graphicsPath9 = new GraphicsPath();
			GraphicsPath graphicsPath10 = new GraphicsPath();
			GraphicsPath graphicsPath11 = new GraphicsPath();
			GraphicsPath graphicsPath12 = new GraphicsPath();
			GraphicsPath graphicsPath13 = new GraphicsPath();
			if (datos_cargados)
			{
				float x = 0f;
				float y = 0f;
				float y2 = 0f;
				float y3 = 0f;
				float y4 = 0f;
				float y5 = 0f;
				float y6 = 0f;
				float y7 = 0f;
				float y8 = 0f;
				float y9 = 0f;
				float y10 = 0f;
				float xmin2 = Xmin;
				float xmax2 = Xmax;
				for (float num9 = xmin2; num9 <= xmax2; num9 += 1f)
				{
					float num10 = num9;
					float num11;
					float num12;
					float num13;
					float num14;
					float num15;
					float num16;
					float num17;
					float num18;
					float num19;
					float num20;
					if (CheckBox5.Checked)
					{
						num11 = Registro[3, (int)Math.Round(num9)];
						num12 = Registro[4, (int)Math.Round(num9)] * -1f;
						num13 = Registro[5, (int)Math.Round(num9)];
						num14 = Registro[6, (int)Math.Round(num9)] * -1f;
						num15 = Registro[7, (int)Math.Round(num9)];
						num16 = Registro[8, (int)Math.Round(num9)];
						num17 = Registro[10, (int)Math.Round(num9)];
						num18 = Registro[18, (int)Math.Round(num9)];
						num19 = Registro[19, (int)Math.Round(num9)];
						num20 = Registro[20, (int)Math.Round(num9)];
					}
					else
					{
						num11 = Registro[3, (int)Math.Round(num9)];
						num12 = Registro[4, (int)Math.Round(num9)];
						num13 = Registro[5, (int)Math.Round(num9)];
						num14 = Registro[6, (int)Math.Round(num9)];
						num15 = Registro[7, (int)Math.Round(num9)];
						num16 = Registro[8, (int)Math.Round(num9)];
						num17 = Registro[10, (int)Math.Round(num9)];
						num18 = Registro[18, (int)Math.Round(num9)];
						num19 = Registro[19, (int)Math.Round(num9)];
						num20 = Registro[20, (int)Math.Round(num9)];
					}
					graphicsPath4.AddLine(x, y, num10, num11);
					graphicsPath5.AddLine(x, y2, num10, num12);
					graphicsPath6.AddLine(x, y3, num10, num13);
					graphicsPath7.AddLine(x, y4, num10, num14);
					graphicsPath8.AddLine(x, y5, num10, num15);
					graphicsPath9.AddLine(x, y6, num10, num16);
					graphicsPath10.AddLine(x, y7, num10, num17);
					graphicsPath11.AddLine(x, y8, num10, num18);
					graphicsPath12.AddLine(x, y9, num10, num19);
					graphicsPath13.AddLine(x, y10, num10, num20);
					x = num10;
					y = num11;
					y2 = num12;
					y3 = num13;
					y4 = num14;
					y5 = num15;
					y6 = num16;
					y7 = num17;
					y8 = num18;
					y9 = num19;
					y10 = num20;
				}
			}
			graphics.SmoothingMode = calidad;
			if (ComboBox2.SelectedIndex == 1)
			{
				GraphicsPath graphicsPath14 = new GraphicsPath();
				Rectangle rect = new Rectangle((int)Math.Round(Xmin), (int)Math.Round(num2), (int)Math.Round(Xmax - Xmin), (int)Math.Round(2f * num));
				graphicsPath14.AddRectangle(rect);
				graphicsPath14.Transform(matriz);
				Region region = new Region(graphicsPath14);
				LinearGradientBrush brush = new LinearGradientBrush(new PointF(0f, 0f), new PointF(0f, PictureBox3.Height), Color.White, Color.WhiteSmoke);
				graphics.FillRegion(brush, region);
			}
			graphicsPath2.Transform(matriz);
			lapiz_ejes_secun_hor.DashStyle = DashStyle.Custom;
			lapiz_ejes_secun_hor.DashPattern = new float[4] { 1f, 3f, 1f, 3f };
			graphics.DrawPath(lapiz_ejes_secun_hor, graphicsPath2);
			graphicsPath3.Transform(matriz);
			graphics.DrawPath(lapiz_ejes_secun_vert, graphicsPath3);
			graphicsPath.Transform(matriz);
			graphics.DrawPath(Lapiz_ejes, graphicsPath);
			if (datos_cargados)
			{
				if (CheckBox14.Checked)
				{
					graphicsPath10.Transform(matriz3);
					graphics.DrawPath(lapiz_vel_ang_crit, graphicsPath10);
				}
				graphicsPath7.Transform(matriz3);
				graphicsPath13.Transform(matriz3);
				graphicsPath9.Transform(matriz3);
				if (CheckBox11.Checked)
				{
					lapiz_gx.DashStyle = DashStyle.Dash;
					graphics.DrawPath(lapiz_gx, graphicsPath7);
				}
				if (CheckBox12.Checked)
				{
					lapiz_gy.DashStyle = DashStyle.Dash;
					graphics.DrawPath(lapiz_gy, graphicsPath13);
					if (CheckBox3.Checked)
					{
						graphicsPath8.Transform(matriz3);
						lapizfiltro2.DashStyle = DashStyle.Dash;
						graphics.DrawPath(lapizfiltro2, graphicsPath8);
					}
				}
				if (CheckBox13.Checked)
				{
					lapiz_gz.DashStyle = DashStyle.Dash;
					graphics.DrawPath(lapiz_gz, graphicsPath9);
				}
				graphicsPath11.Transform(matrix);
				graphicsPath5.Transform(matrix);
				graphicsPath12.Transform(matriz2);
				if (CheckBox7.Checked)
				{
					graphics.DrawPath(lapiz1, graphicsPath11);
					if (CheckBox3.Checked)
					{
						graphicsPath4.Transform(matrix);
						graphics.DrawPath(lapizfiltro1, graphicsPath4);
					}
				}
				if (CheckBox8.Checked)
				{
					graphics.DrawPath(lapiz2, graphicsPath5);
				}
				if (CheckBox10.Checked)
				{
					graphics.DrawPath(lapiz3, graphicsPath12);
					if (CheckBox3.Checked)
					{
						graphicsPath6.Transform(matriz2);
						graphics.DrawPath(lapizfiltro3, graphicsPath6);
					}
				}
			}
			if (indicador)
			{
				_ = (int)Math.Round(Math.Truncate(Xmin + (float)x1i / (FactorescalaejeX * ((float)PictureBox1.Width + ValorminimoejeX) / (Xmax - Xmin))) + 1.0);
				int num21 = (int)((double)(x1i * PictureBox3.Width) / (double)PictureBox1.Width);
				graphics.DrawLine(Pens.Red, num21, 0, num21, PictureBox3.Height);
			}
		}
	}

	private void PictureBox4_Paint(object sender, PaintEventArgs e)
	{
		Graphics graphics = e.Graphics;
		graphics.Clear(PictureBox1.BackColor);
		_ = reproducir;
		_ = 1;
		float value = -40f;
		float num = Math.Max(Math.Abs(40f), Math.Abs(value));
		EscalaX = FactorescalaejeX * ((float)PictureBox4.Width + ValorminimoejeX) / (Xmax - Xmin);
		matriz = new Matrix();
		matriz2 = new Matrix();
		matriz.Scale(EscalaX, -1f * FactorescalaejeY * ((float)PictureBox3.Height + ValorminimoejeX) / (2f * num));
		matriz2.Scale(EscalaX, -1f * FactorescalaejeY * ((float)PictureBox3.Height + ValorminimoejeX) / (2f * num));
		checked
		{
			matriz.Translate(0f - Xmin, (float)((double)(-PictureBox3.Height) / 2.0 / (double)(FactorescalaejeY * ((float)PictureBox3.Height + ValorminimoejeX) / (2f * num))));
			matriz2.Translate(0f - Xmin, (float)((double)(-PictureBox3.Height) / 2.0 / (double)(FactorescalaejeY * ((float)PictureBox3.Height + ValorminimoejeX) / (2f * num))));
			GraphicsPath graphicsPath = new GraphicsPath();
			graphicsPath.AddLine(new PointF(Xmin, 0f), new PointF(Xmax, 0f));
			GraphicsPath graphicsPath2 = new GraphicsPath();
			GraphicsPath graphicsPath3 = new GraphicsPath();
			int num2 = -5;
			do
			{
				graphicsPath2.StartFigure();
				graphicsPath2.AddLine(new PointF(Xmin, num2 * 10), new PointF(Xmax, num2 * 10));
				num2++;
			}
			while (num2 <= -1);
			int num3 = 1;
			do
			{
				graphicsPath2.StartFigure();
				graphicsPath2.AddLine(new PointF(Xmin, num3 * 10), new PointF(Xmax, num3 * 10));
				num3++;
			}
			while (num3 <= 5);
			int nUMEROREGISTROS = NUMEROREGISTROS;
			for (int i = 1; i <= nUMEROREGISTROS; i++)
			{
				graphicsPath3.StartFigure();
				graphicsPath3.AddLine(new PointF(i * muestras_segundo, 2f * num), new PointF(i * muestras_segundo, -2f * num));
			}
			GraphicsPath graphicsPath4 = new GraphicsPath();
			GraphicsPath graphicsPath5 = new GraphicsPath();
			GraphicsPath graphicsPath6 = new GraphicsPath();
			GraphicsPath graphicsPath7 = new GraphicsPath();
			float x = 0f;
			float y = 0f;
			float y2 = 0f;
			float y3 = 0f;
			float y4 = 0f;
			float xmin = Xmin;
			float xmax = Xmax;
			for (float num4 = xmin; num4 <= xmax; num4 += 1f)
			{
				float num5 = num4;
				float num6 = Registro[6, (int)Math.Round(num4)];
				float num7 = Registro[7, (int)Math.Round(num4)];
				float num8 = Registro[8, (int)Math.Round(num4)];
				float num9 = Registro[10, (int)Math.Round(num4)];
				graphicsPath4.AddLine(x, y, num5, num6);
				graphicsPath5.AddLine(x, y2, num5, num7);
				graphicsPath6.AddLine(x, y3, num5, num8);
				graphicsPath7.AddLine(x, y4, num5, num9);
				x = num5;
				y = num6;
				y2 = num7;
				y3 = num8;
				y4 = num9;
			}
			graphics.SmoothingMode = calidad;
			graphicsPath2.Transform(matriz);
			graphics.DrawPath(lapiz_ejes_secun_hor, graphicsPath2);
			graphicsPath3.Transform(matriz);
			graphics.DrawPath(lapiz_ejes_secun_vert, graphicsPath3);
			graphicsPath.Transform(matriz);
			graphics.DrawPath(Lapiz_ejes, graphicsPath);
			graphicsPath4.Transform(matriz2);
			graphicsPath5.Transform(matriz2);
			graphicsPath6.Transform(matriz2);
			graphics.DrawPath(lapiz3, graphicsPath4);
			graphics.DrawPath(lapiz1, graphicsPath5);
			graphics.DrawPath(lapiz2, graphicsPath6);
			if (indicador)
			{
				_ = (int)Math.Round(Math.Truncate(Xmin + (float)x1i / (FactorescalaejeX * ((float)PictureBox1.Width + ValorminimoejeX) / (Xmax - Xmin))) + 1.0);
				int num10 = (int)((double)(x1i * PictureBox3.Width) / (double)PictureBox1.Width);
				graphics.DrawLine(Pens.Red, num10, 0, num10, PictureBox3.Height);
			}
		}
	}

	private void Form1_SizeChanged(object sender, EventArgs e)
	{
	}

	private void Button6_Click(object sender, EventArgs e)
	{
		Button1.Enabled = false;
		Button3.Enabled = false;
		Button4.Enabled = false;
		Button8.Enabled = false;
		Button7.Enabled = true;
		Button9.Enabled = true;
		Button6.Enabled = false;
		Timer1.Interval = checked(100 - TrackBar1.Value);
		Timer1.Start();
	}

	private void Button7_Click(object sender, EventArgs e)
	{
		Button1.Enabled = true;
		Button3.Enabled = true;
		Button4.Enabled = true;
		Button8.Enabled = true;
		Button7.Enabled = false;
		Button9.Enabled = true;
		Button6.Enabled = true;
		HScrollBar1.Enabled = true;
		Timer1.Stop();
	}

	private void Button9_Click(object sender, EventArgs e)
	{
		Button1.Enabled = true;
		Button3.Enabled = true;
		Button4.Enabled = true;
		Button8.Enabled = true;
		Button7.Enabled = false;
		Button9.Enabled = false;
		Button6.Enabled = true;
		HScrollBar1.Enabled = true;
		reproducir = 0;
		Timer1.Stop();
	}

	private void Timer1_Tick(object sender, EventArgs e)
	{
		int maximum = HScrollBar1.Maximum;
		reproducir = 1;
		if (HScrollBar1.Value < maximum)
		{
			HScrollBar1.Value = checked(HScrollBar1.Value + 1);
		}
	}

	private void HScrollBar1_ValueChanged(object sender, EventArgs e)
	{
		Xmin = HScrollBar1.Value;
		Xmax = Xmin + (Xmaxanterior - Xminanterior);
		Xmaxanterior = Xmax;
		Xminanterior = Xmin;
		Dibujar();
	}

	private void Label22_MouseEnter(object sender, EventArgs e)
	{
		Cursor = Cursors.Hand;
	}

	private void Label22_MouseLeave(object sender, EventArgs e)
	{
		Cursor = Cursors.Default;
	}

	private void CheckBox4_CheckedChanged(object sender, EventArgs e)
	{
		Panel8.Visible = CheckBox4.Checked;
		Dibujar();
	}

	private void CheckBox5_CheckedChanged(object sender, EventArgs e)
	{
		Dibujar();
	}

	private void TrackBar1_Scroll(object sender, EventArgs e)
	{
		checked
		{
			Timer1.Interval = 100 - TrackBar1.Value;
			TextBox24.Text = Conversions.ToString(100 - TrackBar1.Value);
		}
	}

	private void actualizar_curvas_filtradas()
	{
	}

	private void Button12_Click(object sender, EventArgs e)
	{
		checked
		{
			try
			{
				FI_max = 0f;
				THETA_max = 0f;
				_ = matricula;
				Thread.CurrentThread.CurrentCulture = new CultureInfo("es-ES");
				string[] array = Strings.Split(Conversions.ToString(MonthCalendar1.SelectionStart.Date), "/", -1, CompareMethod.Text);
				string text = array[0] + "-" + array[1] + "-" + array[2];
				string text2 = array[2];
				string text3 = matricula;
				if (text3.Length == 1)
				{
					text3 = "00000" + text3;
				}
				else if (text3.Length == 2)
				{
					text3 = "0000" + text3;
				}
				else if (text3.Length == 3)
				{
					text3 = "000" + text3;
				}
				else if (text3.Length == 4)
				{
					text3 = "00" + text3;
				}
				else if (text3.Length == 5)
				{
					text3 = "0" + text3;
				}
				Ruta = MyProject.Forms.Principal.ruta_raiz + "\\VEXT-IS1\\VEXT-IS1-" + text3 + "\\" + text2 + "\\" + text3 + " - " + text + ".csv";
				MyProject.Forms.barra.Show();
				MyProject.Forms.barra.Update();
				int num = File.ReadAllLines(Ruta).Length;
				using TextFieldParser textFieldParser = new TextFieldParser(Ruta);
				textFieldParser.TextFieldType = FieldType.Delimited;
				textFieldParser.SetDelimiters(";");
				int num2 = 0;
				int num3 = 0;
				int num4 = 0;
				float num5 = 0f;
				int num6 = 0;
				int num7 = 0;
				ListBox2.Items.Clear();
				while (!textFieldParser.EndOfData)
				{
					currentRow = textFieldParser.ReadFields();
					if (currentRow.Length == 18)
					{
						if (num2 > 0)
						{
							num5 = (float)(Math.Round(100.0 * ((double)num4 / 36000.0)) / 100.0);
							ListBox2.Items.Add("T" + Conversions.ToString(num6) + " - " + RM.GetString("inicio") + ": " + hora_inicio_tramo + " - " + RM.GetString("duracion") + " : " + Conversions.ToString(num5) + " h");
							Inicio_Grafica[1, num3 - 1] = num4;
							num4 = 0;
						}
						hora_inicio_tramo = currentRow[3];
						num6 = Conversions.ToInteger(currentRow[16]);
						ref int[,] inicio_Grafica = ref Inicio_Grafica;
						inicio_Grafica = (int[,])Utils.CopyArray(inicio_Grafica, new int[2, num3 + 1]);
						Inicio_Grafica[0, num3] = num2 + 1;
						num3++;
					}
					else
					{
						num4++;
					}
					num2++;
					num7 = (int)Math.Round((double)(textFieldParser.LineNumber * 100) / (double)num);
					MyProject.Forms.barra.Label1.Text = "Cargando Registro: " + Conversions.ToString(Math.Round((double)(textFieldParser.LineNumber * 100) / (double)num)) + "% completado ";
					MyProject.Forms.barra.ProgressBar1.Value = num7;
					MyProject.Forms.barra.Refresh();
					Application.DoEvents();
				}
				num5 = (float)(Math.Round(100.0 * ((double)num4 / 36000.0)) / 100.0);
				ListBox2.Items.Add("T" + Conversions.ToString(num6) + " - " + RM.GetString("inicio") + ": " + hora_inicio_tramo + " - " + RM.GetString("duracion") + " : " + Conversions.ToString(num5) + " h");
				Inicio_Grafica[1, num3 - 1] = num4;
				ListBox2.SelectedIndex = 0;
				Button1.Enabled = true;
			}
			catch (Exception ex)
			{
				ProjectData.SetProjectError(ex);
				Exception ex2 = ex;
				ProjectData.ClearProjectError();
			}
			string name = MySettingsProperty.Settings.idioma;
			Thread.CurrentThread.CurrentCulture = new CultureInfo(name);
			MyProject.Forms.barra.Close();
		}
	}

	private void CheckBox7_CheckedChanged(object sender, EventArgs e)
	{
		Dibujar();
	}

	private void CheckBox8_CheckedChanged(object sender, EventArgs e)
	{
		Dibujar();
	}

	private void CheckBox10_CheckedChanged_1(object sender, EventArgs e)
	{
		Dibujar();
	}

	private void CheckBox11_CheckedChanged(object sender, EventArgs e)
	{
		Dibujar();
	}

	private void CheckBox12_CheckedChanged(object sender, EventArgs e)
	{
		Dibujar();
	}

	private void CheckBox13_CheckedChanged(object sender, EventArgs e)
	{
		Dibujar();
	}

	private void CheckBox14_CheckedChanged(object sender, EventArgs e)
	{
		Dibujar();
	}

	private void Button14_Click(object sender, EventArgs e)
	{
		if (!avanzado)
		{
			Panel7.Visible = true;
			avanzado = true;
		}
		else
		{
			Panel7.Visible = false;
			avanzado = false;
		}
	}

	private void CheckBox3_CheckedChanged(object sender, EventArgs e)
	{
		Dibujar();
	}

	private void CheckBox1_CheckedChanged(object sender, EventArgs e)
	{
		if (CheckBox1.Checked)
		{
			calidad = SmoothingMode.HighQuality;
		}
		else
		{
			calidad = SmoothingMode.Default;
		}
		Dibujar();
	}

	private void RadioButton2_CheckedChanged(object sender, EventArgs e)
	{
		Size_adjust();
	}

	private void PictureBox1_Click(object sender, EventArgs e)
	{
	}

	private void ComboBox2_SelectedIndexChanged(object sender, EventArgs e)
	{
		if (ComboBox2.SelectedIndex == 1)
		{
			CheckBox1.Checked = true;
		}
		else
		{
			CheckBox1.Checked = false;
		}
		Dibujar();
	}

	private void PictureBox2_Click(object sender, EventArgs e)
	{
	}

	private void Button10_Click(object sender, EventArgs e)
	{
		indicealarma = Convert.ToInt32(NumericUpDown1.Value);
		decimal value = NumericUpDown2.Value;
		float num = default(float);
		if (decimal.Compare(value, 4m) == 0)
		{
			num = (float)((double)matrizalarmas4[0, indicealarma] / 1.0);
		}
		else if (decimal.Compare(value, 3m) == 0)
		{
			num = (float)((double)matrizalarmas3[0, indicealarma] / 1.0);
		}
		else if (decimal.Compare(value, 2m) == 0)
		{
			num = (float)((double)matrizalarmas2[0, indicealarma] / 1.0);
		}
		else if (decimal.Compare(value, 1m) == 0)
		{
			num = (float)((double)matrizalarmas[0, indicealarma] / 1.0);
		}
		checked
		{
			if ((num > Xmin) & (num < Xmax))
			{
				num = (num - Xmin) * (float)PictureBox1.Width / (Xmax - Xmin);
				x1i = (int)Math.Round(num);
				y1i = 0;
				x2i = (int)Math.Round(num);
				y2i = PictureBox1.Height;
				indicador = true;
			}
			Dibujar();
		}
	}

	private void Button13_Click(object sender, EventArgs e)
	{
		OpenFileDialog openFileDialog = new OpenFileDialog();
		openFileDialog.InitialDirectory = "C:\\";
		openFileDialog.Title = RM.GetString("seleccione");
		if (openFileDialog.ShowDialog() != DialogResult.OK)
		{
			return;
		}
		checked
		{
			try
			{
				Ruta = openFileDialog.FileName;
				MyProject.Forms.barra.Show();
				MyProject.Forms.barra.ProgressBar1.Maximum = 100;
				MyProject.Forms.barra.ProgressBar1.Minimum = 10;
				MyProject.Forms.barra.ProgressBar1.Value = 50;
				MyProject.Forms.barra.ProgressBar1.Refresh();
				MyProject.Forms.barra.Update();
				Cursor.Current = Cursors.WaitCursor;
				MonthCalendar1.Enabled = false;
				using (TextFieldParser textFieldParser = new TextFieldParser(Ruta))
				{
					textFieldParser.TextFieldType = FieldType.Delimited;
					textFieldParser.SetDelimiters(";");
					int num = 0;
					int num2 = 0;
					int num3 = 0;
					float num4 = 0f;
					int num5 = 0;
					ListBox2.Items.Clear();
					while (!textFieldParser.EndOfData)
					{
						currentRow = textFieldParser.ReadFields();
						if (currentRow.Length == 18)
						{
							if (num > 0)
							{
								num4 = (float)(Math.Round(100.0 * ((double)num3 / 36000.0)) / 100.0);
								ListBox2.Items.Add("T" + Conversions.ToString(num5) + " - " + RM.GetString("inicio") + ": " + hora_inicio_tramo + " - " + RM.GetString("duracion") + " : " + Conversions.ToString(num4) + " h");
								Inicio_Grafica[1, num2 - 1] = num3;
								num3 = 0;
							}
							hora_inicio_tramo = currentRow[3];
							num5 = Conversions.ToInteger(currentRow[16]);
							ref int[,] inicio_Grafica = ref Inicio_Grafica;
							inicio_Grafica = (int[,])Utils.CopyArray(inicio_Grafica, new int[2, num2 + 1]);
							Inicio_Grafica[0, num2] = num + 1;
							num2++;
						}
						else
						{
							num3++;
						}
						num++;
					}
					num4 = (float)(Math.Round(100.0 * ((double)num3 / 36000.0)) / 100.0);
					ListBox2.Items.Add("T" + Conversions.ToString(num5) + " - " + RM.GetString("inicio") + ": " + hora_inicio_tramo + " - " + RM.GetString("duracion") + " : " + Conversions.ToString(num4) + " h");
					Inicio_Grafica[1, num2 - 1] = num3;
					ListBox2.SelectedIndex = 0;
					Button1.Enabled = true;
				}
				Cursor.Current = Cursors.Default;
				MonthCalendar1.Enabled = true;
				MyProject.Forms.barra.Close();
			}
			catch (Exception ex)
			{
				ProjectData.SetProjectError(ex);
				Exception ex2 = ex;
				Interaction.MsgBox(RM.GetString("errorformato"), MsgBoxStyle.OkOnly, "Error");
				ProjectData.ClearProjectError();
			}
		}
	}

	private void actualizar_uco()
	{
		if (RGBindingSource.Count == 0)
		{
			ComboBox1.Items.Clear();
			return;
		}
		ComboBox1.Items.Clear();
		ComboBox1.Items.Add(RM.GetString("todos"));
		int num = 0;
		checked
		{
			int num2 = RGBindingSource.Count - 1;
			for (int i = 0; i <= num2; i++)
			{
				string num_Identificacion = VehiculosDataSet.RG[i].Num_Identificacion;
				int num3 = ComboBox1.Items.Count - 1;
				for (int j = 0; j <= num3; j++)
				{
					if (Operators.ConditionalCompareObjectEqual(num_Identificacion, ComboBox1.Items[j], TextCompare: false))
					{
						num = 1;
					}
				}
				if (num == 0)
				{
					ComboBox1.Items.Add(num_Identificacion);
				}
				num = 0;
			}
			ComboBox1.SelectedIndex = 0;
		}
	}

	private void PictureBox6_Click(object sender, EventArgs e)
	{
	}

	private void TextBox3_TextChanged(object sender, EventArgs e)
	{
		NumericUpDown1.Maximum = new decimal(String_a_Numero(TextBox3.Text));
	}

	private void ComboBox1_SelectedIndexChanged(object sender, EventArgs e)
	{
		actualizar_lista();
	}

	private void NumericUpDown2_ValueChanged(object sender, EventArgs e)
	{
		decimal value = NumericUpDown2.Value;
		if (decimal.Compare(value, 1m) == 0)
		{
			TextBox3.Text = Conversions.ToString(alarmas);
		}
		else if (decimal.Compare(value, 2m) == 0)
		{
			TextBox3.Text = Conversions.ToString(alarmas2);
		}
		else if (decimal.Compare(value, 3m) == 0)
		{
			TextBox3.Text = Conversions.ToString(alarmas3);
		}
		else if (decimal.Compare(value, 4m) == 0)
		{
			TextBox3.Text = Conversions.ToString(alarmas4);
		}
	}

	private void Button11_Click(object sender, EventArgs e)
	{
		GroupBox3.Visible = !GroupBox3.Visible;
	}

	private void PictureBox8_Paint(object sender, PaintEventArgs e)
	{
		Graphics graphics = e.Graphics;
		float value = -100f;
		float num = 100f;
		float num2 = -100f;
		float num3 = Math.Max(Math.Abs(100f), Math.Abs(value));
		EscalaX = FactorescalaejeX * ((float)PictureBox8.Width + ValorminimoejeX) / (num - num2);
		matriz = new Matrix();
		matriz.Scale(EscalaX, -1f * FactorescalaejeY * (float)PictureBox8.Height / (2f * num3));
		matriz.Translate(100f, -100f);
		graphics.SmoothingMode = SmoothingMode.HighQuality;
		if (indicador)
		{
			GraphicsPath graphicsPath = new GraphicsPath();
			Rectangle rect = checked(new Rectangle((int)Math.Floor(100f * gx - 5f), (int)Math.Floor(100f * gy - 5f), 10, 10));
			graphicsPath.AddEllipse(rect);
			graphicsPath.Transform(matriz);
			Pen pen = new Pen(Color.Red, 4f);
			graphics.DrawPath(pen, graphicsPath);
			if (Registro[11, x1_int] > 40f)
			{
				PictureBox8.BackColor = Color.White;
			}
			else if (Registro[11, x1_int] > 20f)
			{
				PictureBox8.BackColor = Color.Yellow;
			}
			else
			{
				PictureBox8.BackColor = Color.Red;
			}
		}
	}

	private void NumericUpDown1_ValueChanged(object sender, EventArgs e)
	{
	}

	private void Button16_Click(object sender, EventArgs e)
	{
		Color backColor = default(Color);
		if (!noche)
		{
			backColor = BackColor;
		}
		noche = !noche;
		if (noche)
		{
			BackColor = Color.LightSlateGray;
		}
		else
		{
			BackColor = backColor;
		}
	}

	private void Button15_Click(object sender, EventArgs e)
	{
		GroupBox3.Visible = false;
	}

	private void PictureBox3_Click(object sender, EventArgs e)
	{
		Panel2.Visible = !Panel2.Visible;
	}

	private void Button17_Click(object sender, EventArgs e)
	{
		Panel2.Visible = false;
	}

	private void Button18_Click(object sender, EventArgs e)
	{
		Panel2.Visible = true;
	}

	private void Button19_Click(object sender, EventArgs e)
	{
		SaveFileDialog saveFileDialog = new SaveFileDialog();
		saveFileDialog.Filter = "csv |*.csv";
		saveFileDialog.FilterIndex = 2;
		saveFileDialog.RestoreDirectory = true;
		checked
		{
			if (saveFileDialog.ShowDialog() == DialogResult.OK)
			{
				StreamWriter streamWriter = MyProject.Computer.FileSystem.OpenTextFileWriter(saveFileDialog.FileName, append: true);
				streamWriter.WriteLine("Alarm level ; Time ; speed");
				int num = alarmas - 1;
				for (int i = 0; i <= num; i++)
				{
					streamWriter.WriteLine(Conversions.ToString(matrizalarmas[1, i]) + " ; " + Hora[0, matrizalarmas[0, i]] + " ; " + Conversions.ToString(Registro[14, matrizalarmas[0, i]]));
				}
				streamWriter.Close();
			}
		}
	}

	private void PictureBox9_Paint(object sender, PaintEventArgs e)
	{
		if (!indicador)
		{
			return;
		}
		Graphics graphics = e.Graphics;
		float num = 50f;
		float num2 = -50f;
		Math.Max(Math.Abs(num), Math.Abs(num2));
		float num3 = (float)PictureBox9.Width / (num - num2);
		matriz = new Matrix();
		matriz.Scale(num3, 0f - num3);
		matriz.Translate(num - trayectoria[0, x1_int], -1f * (num + trayectoria[1, x1_int]));
		GraphicsPath graphicsPath = new GraphicsPath();
		GraphicsPath graphicsPath2 = new GraphicsPath();
		graphics.SmoothingMode = SmoothingMode.HighQuality;
		checked
		{
			if (datos_cargados)
			{
				if (x1_int <= 500)
				{
					int num4 = x1_int;
					for (int i = 1; i <= num4; i++)
					{
						graphicsPath.AddLine(trayectoria[0, i - 1], trayectoria[1, i - 1], trayectoria[0, i], trayectoria[1, i]);
					}
				}
				else
				{
					int num5 = 1;
					do
					{
						graphicsPath.AddLine(trayectoria[0, x1_int - 500 + num5 - 1], trayectoria[1, x1_int - 500 + num5 - 1], trayectoria[0, x1_int - 500 + num5], trayectoria[1, x1_int - 500 + num5]);
						num5++;
					}
					while (num5 <= 500);
				}
				Rectangle rect = new Rectangle((int)Math.Round(Math.Round(trayectoria[0, x1_int]) - 5.0), (int)Math.Round(Math.Round(trayectoria[1, x1_int]) - 5.0), 10, 10);
				graphicsPath2.AddEllipse(rect);
				if (x1_int > 10)
				{
					rect = new Rectangle((int)Math.Round(Math.Round(trayectoria[0, x1_int - 10]) - 4.0), (int)Math.Round(Math.Floor(trayectoria[1, x1_int - 10]) - 4.0), 8, 8);
					graphicsPath2.AddEllipse(rect);
					rect = new Rectangle((int)Math.Round(Math.Round(trayectoria[0, x1_int - 20]) - 3.0), (int)Math.Round(Math.Floor(trayectoria[1, x1_int - 20]) - 3.0), 6, 6);
					graphicsPath2.AddEllipse(rect);
					rect = new Rectangle((int)Math.Round(Math.Round(trayectoria[0, x1_int - 30]) - 2.0), (int)Math.Round(Math.Floor(trayectoria[1, x1_int - 30]) - 2.0), 4, 4);
					graphicsPath2.AddEllipse(rect);
					rect = new Rectangle((int)Math.Round(Math.Round(trayectoria[0, x1_int - 40]) - 1.0), (int)Math.Round(Math.Floor(trayectoria[1, x1_int - 40]) - 1.0), 2, 2);
					graphicsPath2.AddEllipse(rect);
				}
				graphicsPath2.Transform(matriz);
				Pen pen = new Pen(Color.Red, 2f);
				graphics.DrawPath(pen, graphicsPath2);
			}
			graphicsPath.Transform(matriz);
			graphics.DrawPath(lapiz1, graphicsPath);
		}
	}

	private void ListBox2_SystemColorsChanged(object sender, EventArgs e)
	{
	}

	private void CheckBox6_CheckedChanged(object sender, EventArgs e)
	{
		Panel3.Visible = CheckBox6.Checked;
	}

	private void CheckBox15_CheckedChanged(object sender, EventArgs e)
	{
		TextBox7.Visible = CheckBox15.Checked;
		TextBox8.Visible = CheckBox15.Checked;
		Label8.Visible = CheckBox15.Checked;
		Label9.Visible = CheckBox15.Checked;
	}

	private void CheckBox16_CheckedChanged(object sender, EventArgs e)
	{
		PictureBox2.Visible = CheckBox16.Checked;
	}

	private void PictureBox1_Disposed(object sender, EventArgs e)
	{
	}

	private void Button1_HandleDestroyed(object sender, EventArgs e)
	{
	}

	private void PictureBox5_Click(object sender, EventArgs e)
	{
	}

	private void TextBox25_TextChanged(object sender, EventArgs e)
	{
	}

	private void Button1_SizeChanged(object sender, EventArgs e)
	{
	}

	private void Button1_DoubleClick(object sender, EventArgs e)
	{
	}

	private void PictureBox15_AutoSizeChanged(object sender, EventArgs e)
	{
	}

	private void MonthCalendar1_DoubleClick(object sender, EventArgs e)
	{
		if (!(Cursor == Cursors.WaitCursor))
		{
			ListBox2.Items.Clear();
			Button12.PerformClick();
		}
	}

	private void PictureBox2_PaddingChanged(object sender, EventArgs e)
	{
	}

	private void Button1_Invalidated(object sender, InvalidateEventArgs e)
	{
	}

	private void TextBox25_Click(object sender, EventArgs e)
	{
		TextBox25.Text = Application.StartupPath;
	}

	private void Button1_ContextMenuStripChanged(object sender, EventArgs e)
	{
	}

	[DebuggerNonUserCode]
	protected override void Dispose(bool disposing)
	{
		try
		{
			if (disposing && components != null)
			{
				components.Dispose();
			}
		}
		finally
		{
			base.Dispose(disposing);
		}
	}

	[System.Diagnostics.DebuggerStepThrough]
	private void InitializeComponent()
	{
		this.components = new System.ComponentModel.Container();
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(IncliGraph_V1._1_Pro.Form1));
		this.Button1 = new System.Windows.Forms.Button();
		this.PictureBox1 = new System.Windows.Forms.PictureBox();
		this.Button3 = new System.Windows.Forms.Button();
		this.Button4 = new System.Windows.Forms.Button();
		this.HScrollBar1 = new System.Windows.Forms.HScrollBar();
		this.Button8 = new System.Windows.Forms.Button();
		this.TextBox3 = new System.Windows.Forms.TextBox();
		this.TextBox4 = new System.Windows.Forms.TextBox();
		this.Label8 = new System.Windows.Forms.Label();
		this.Label9 = new System.Windows.Forms.Label();
		this.TextBox7 = new System.Windows.Forms.TextBox();
		this.TextBox8 = new System.Windows.Forms.TextBox();
		this.GroupBox9 = new System.Windows.Forms.GroupBox();
		this.NumericUpDown2 = new System.Windows.Forms.NumericUpDown();
		this.CheckBox5 = new System.Windows.Forms.CheckBox();
		this.Label44 = new System.Windows.Forms.Label();
		this.TextBox27 = new System.Windows.Forms.TextBox();
		this.TextBox14 = new System.Windows.Forms.TextBox();
		this.Label29 = new System.Windows.Forms.Label();
		this.Label1 = new System.Windows.Forms.Label();
		this.Label28 = new System.Windows.Forms.Label();
		this.TextBox17 = new System.Windows.Forms.TextBox();
		this.Label27 = new System.Windows.Forms.Label();
		this.TextBox28 = new System.Windows.Forms.TextBox();
		this.TextBox2 = new System.Windows.Forms.TextBox();
		this.Label17 = new System.Windows.Forms.Label();
		this.Label3 = new System.Windows.Forms.Label();
		this.Label45 = new System.Windows.Forms.Label();
		this.NumericUpDown1 = new System.Windows.Forms.NumericUpDown();
		this.Button10 = new System.Windows.Forms.Button();
		this.TextBox9 = new System.Windows.Forms.TextBox();
		this.CheckBox9 = new System.Windows.Forms.CheckBox();
		this.Button2 = new System.Windows.Forms.Button();
		this.TextBox23 = new System.Windows.Forms.TextBox();
		this.Label23 = new System.Windows.Forms.Label();
		this.GroupBox10 = new System.Windows.Forms.GroupBox();
		this.GroupBox11 = new System.Windows.Forms.GroupBox();
		this.Panel3 = new System.Windows.Forms.Panel();
		this.TextBox15 = new System.Windows.Forms.TextBox();
		this.TextBox16 = new System.Windows.Forms.TextBox();
		this.TextBox10 = new System.Windows.Forms.TextBox();
		this.Label26 = new System.Windows.Forms.Label();
		this.TextBox6 = new System.Windows.Forms.TextBox();
		this.Label2 = new System.Windows.Forms.Label();
		this.Label5 = new System.Windows.Forms.Label();
		this.Label13 = new System.Windows.Forms.Label();
		this.Panel7 = new System.Windows.Forms.Panel();
		this.TextBox5 = new System.Windows.Forms.TextBox();
		this.TextBox12 = new System.Windows.Forms.TextBox();
		this.CheckBox3 = new System.Windows.Forms.CheckBox();
		this.Label31 = new System.Windows.Forms.Label();
		this.Label32 = new System.Windows.Forms.Label();
		this.Label35 = new System.Windows.Forms.Label();
		this.Label36 = new System.Windows.Forms.Label();
		this.Label34 = new System.Windows.Forms.Label();
		this.Button14 = new System.Windows.Forms.Button();
		this.CheckBox4 = new System.Windows.Forms.CheckBox();
		this.TextBox11 = new System.Windows.Forms.TextBox();
		this.CheckBox2 = new System.Windows.Forms.CheckBox();
		this.RadioButton2 = new System.Windows.Forms.RadioButton();
		this.Label25 = new System.Windows.Forms.Label();
		this.ProgressBar1 = new System.Windows.Forms.ProgressBar();
		this.TextBox13 = new System.Windows.Forms.TextBox();
		this.Label22 = new System.Windows.Forms.Label();
		this.ListBox1 = new System.Windows.Forms.ListBox();
		this.Label24 = new System.Windows.Forms.Label();
		this.MonthCalendar1 = new System.Windows.Forms.MonthCalendar();
		this.Label12 = new System.Windows.Forms.Label();
		this.ListBox2 = new System.Windows.Forms.ListBox();
		this.Panel1 = new System.Windows.Forms.Panel();
		this.Button12 = new System.Windows.Forms.Button();
		this.Button5 = new System.Windows.Forms.Button();
		this.PictureBox2 = new System.Windows.Forms.PictureBox();
		this.PictureBox3 = new System.Windows.Forms.PictureBox();
		this.PictureBox4 = new System.Windows.Forms.PictureBox();
		this.PictureBox5 = new System.Windows.Forms.PictureBox();
		this.Panel2 = new System.Windows.Forms.Panel();
		this.Button17 = new System.Windows.Forms.Button();
		this.CheckBox14 = new System.Windows.Forms.CheckBox();
		this.CheckBox13 = new System.Windows.Forms.CheckBox();
		this.CheckBox12 = new System.Windows.Forms.CheckBox();
		this.CheckBox11 = new System.Windows.Forms.CheckBox();
		this.CheckBox10 = new System.Windows.Forms.CheckBox();
		this.CheckBox8 = new System.Windows.Forms.CheckBox();
		this.CheckBox7 = new System.Windows.Forms.CheckBox();
		this.TextBox20 = new System.Windows.Forms.TextBox();
		this.TextBox21 = new System.Windows.Forms.TextBox();
		this.TextBox1 = new System.Windows.Forms.TextBox();
		this.Label30 = new System.Windows.Forms.Label();
		this.Label18 = new System.Windows.Forms.Label();
		this.TextBox18 = new System.Windows.Forms.TextBox();
		this.TextBox29 = new System.Windows.Forms.TextBox();
		this.TextBox22 = new System.Windows.Forms.TextBox();
		this.Label16 = new System.Windows.Forms.Label();
		this.Label19 = new System.Windows.Forms.Label();
		this.TextBox19 = new System.Windows.Forms.TextBox();
		this.Label20 = new System.Windows.Forms.Label();
		this.Label6 = new System.Windows.Forms.Label();
		this.Label10 = new System.Windows.Forms.Label();
		this.Panel4 = new System.Windows.Forms.Panel();
		this.Button6 = new System.Windows.Forms.Button();
		this.Button7 = new System.Windows.Forms.Button();
		this.Button9 = new System.Windows.Forms.Button();
		this.PictureBox6 = new System.Windows.Forms.PictureBox();
		this.Timer1 = new System.Windows.Forms.Timer(this.components);
		this.TrackBar1 = new System.Windows.Forms.TrackBar();
		this.TextBox24 = new System.Windows.Forms.TextBox();
		this.Button13 = new System.Windows.Forms.Button();
		this.Label14 = new System.Windows.Forms.Label();
		this.Label11 = new System.Windows.Forms.Label();
		this.Label21 = new System.Windows.Forms.Label();
		this.Label4 = new System.Windows.Forms.Label();
		this.CheckBox1 = new System.Windows.Forms.CheckBox();
		this.Label7 = new System.Windows.Forms.Label();
		this.Label15 = new System.Windows.Forms.Label();
		this.Label33 = new System.Windows.Forms.Label();
		this.ComboBox1 = new System.Windows.Forms.ComboBox();
		this.GroupBox1 = new System.Windows.Forms.GroupBox();
		this.PictureBox7 = new System.Windows.Forms.PictureBox();
		this.Panel5 = new System.Windows.Forms.Panel();
		this.Label39 = new System.Windows.Forms.Label();
		this.Label38 = new System.Windows.Forms.Label();
		this.Label37 = new System.Windows.Forms.Label();
		this.Panel6 = new System.Windows.Forms.Panel();
		this.Label42 = new System.Windows.Forms.Label();
		this.Label40 = new System.Windows.Forms.Label();
		this.Label41 = new System.Windows.Forms.Label();
		this.RadioButton1 = new System.Windows.Forms.RadioButton();
		this.ComboBox2 = new System.Windows.Forms.ComboBox();
		this.Label43 = new System.Windows.Forms.Label();
		this.Panel8 = new System.Windows.Forms.Panel();
		this.PictureBox8 = new System.Windows.Forms.PictureBox();
		this.PictureBox9 = new System.Windows.Forms.PictureBox();
		this.RGBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.VehiculosDataSet = new IncliGraph_V1._1_Pro.VehiculosDataSet();
		this.RGTableAdapter = new IncliGraph_V1._1_Pro.VehiculosDataSetTableAdapters.RGTableAdapter();
		this.DatosDataSet = new IncliGraph_V1._1_Pro.DatosDataSet();
		this.DescargasBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.DescargasTableAdapter = new IncliGraph_V1._1_Pro.DatosDataSetTableAdapters.DescargasTableAdapter();
		this.GroupBox2 = new System.Windows.Forms.GroupBox();
		this.Button19 = new System.Windows.Forms.Button();
		this.GroupBox3 = new System.Windows.Forms.GroupBox();
		this.TextBox25 = new System.Windows.Forms.TextBox();
		this.CheckBox6 = new System.Windows.Forms.CheckBox();
		this.CheckBox15 = new System.Windows.Forms.CheckBox();
		this.CheckBox16 = new System.Windows.Forms.CheckBox();
		this.Button16 = new System.Windows.Forms.Button();
		this.GroupBox4 = new System.Windows.Forms.GroupBox();
		this.Button15 = new System.Windows.Forms.Button();
		this.Button11 = new System.Windows.Forms.Button();
		this.Button18 = new System.Windows.Forms.Button();
		this.PictureBox10 = new System.Windows.Forms.PictureBox();
		this.PictureBox11 = new System.Windows.Forms.PictureBox();
		this.PictureBox12 = new System.Windows.Forms.PictureBox();
		this.PictureBox13 = new System.Windows.Forms.PictureBox();
		this.PictureBox14 = new System.Windows.Forms.PictureBox();
		this.PictureBox15 = new System.Windows.Forms.PictureBox();
		((System.ComponentModel.ISupportInitialize)this.PictureBox1).BeginInit();
		this.GroupBox9.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.NumericUpDown2).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.NumericUpDown1).BeginInit();
		this.GroupBox10.SuspendLayout();
		this.GroupBox11.SuspendLayout();
		this.Panel3.SuspendLayout();
		this.Panel7.SuspendLayout();
		this.Panel1.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.PictureBox2).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.PictureBox3).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.PictureBox4).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.PictureBox5).BeginInit();
		this.Panel2.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.PictureBox6).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.TrackBar1).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.PictureBox7).BeginInit();
		this.Panel5.SuspendLayout();
		this.Panel6.SuspendLayout();
		this.Panel8.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.PictureBox8).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.PictureBox9).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.RGBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.VehiculosDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.DatosDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.DescargasBindingSource).BeginInit();
		this.GroupBox2.SuspendLayout();
		this.GroupBox3.SuspendLayout();
		this.GroupBox4.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.PictureBox10).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.PictureBox11).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.PictureBox12).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.PictureBox13).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.PictureBox14).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.PictureBox15).BeginInit();
		base.SuspendLayout();
		resources.ApplyResources(this.Button1, "Button1");
		this.Button1.Name = "Button1";
		this.Button1.UseVisualStyleBackColor = true;
		this.PictureBox1.BackColor = System.Drawing.SystemColors.Window;
		this.PictureBox1.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		this.PictureBox1.Cursor = System.Windows.Forms.Cursors.Cross;
		resources.ApplyResources(this.PictureBox1, "PictureBox1");
		this.PictureBox1.Name = "PictureBox1";
		this.PictureBox1.TabStop = false;
		this.Button3.FlatAppearance.BorderColor = System.Drawing.Color.White;
		resources.ApplyResources(this.Button3, "Button3");
		this.Button3.Image = IncliGraph_V1._1_Pro.My.Resources.Resources.zoom_interface__2_;
		this.Button3.Name = "Button3";
		this.Button3.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.Button4, "Button4");
		this.Button4.Image = IncliGraph_V1._1_Pro.My.Resources.Resources.zoom_out_symbol__2_;
		this.Button4.Name = "Button4";
		this.Button4.UseVisualStyleBackColor = true;
		this.HScrollBar1.LargeChange = 1;
		resources.ApplyResources(this.HScrollBar1, "HScrollBar1");
		this.HScrollBar1.Maximum = 0;
		this.HScrollBar1.Name = "HScrollBar1";
		resources.ApplyResources(this.Button8, "Button8");
		this.Button8.Image = IncliGraph_V1._1_Pro.My.Resources.Resources.expand__2_;
		this.Button8.Name = "Button8";
		this.Button8.UseVisualStyleBackColor = true;
		this.TextBox3.BackColor = System.Drawing.SystemColors.ButtonHighlight;
		resources.ApplyResources(this.TextBox3, "TextBox3");
		this.TextBox3.Name = "TextBox3";
		this.TextBox3.ReadOnly = true;
		this.TextBox4.BackColor = System.Drawing.SystemColors.ButtonHighlight;
		resources.ApplyResources(this.TextBox4, "TextBox4");
		this.TextBox4.Name = "TextBox4";
		this.TextBox4.ReadOnly = true;
		resources.ApplyResources(this.Label8, "Label8");
		this.Label8.BackColor = System.Drawing.SystemColors.Control;
		this.Label8.Name = "Label8";
		resources.ApplyResources(this.Label9, "Label9");
		this.Label9.BackColor = System.Drawing.SystemColors.Control;
		this.Label9.Name = "Label9";
		this.TextBox7.BackColor = System.Drawing.Color.White;
		resources.ApplyResources(this.TextBox7, "TextBox7");
		this.TextBox7.Name = "TextBox7";
		this.TextBox7.ReadOnly = true;
		this.TextBox8.BackColor = System.Drawing.Color.White;
		resources.ApplyResources(this.TextBox8, "TextBox8");
		this.TextBox8.Name = "TextBox8";
		this.TextBox8.ReadOnly = true;
		this.GroupBox9.Controls.Add(this.NumericUpDown2);
		this.GroupBox9.Controls.Add(this.CheckBox5);
		this.GroupBox9.Controls.Add(this.Label44);
		this.GroupBox9.Controls.Add(this.TextBox27);
		this.GroupBox9.Controls.Add(this.TextBox14);
		this.GroupBox9.Controls.Add(this.TextBox3);
		this.GroupBox9.Controls.Add(this.Label29);
		this.GroupBox9.Controls.Add(this.Label1);
		this.GroupBox9.Controls.Add(this.Label28);
		this.GroupBox9.Controls.Add(this.TextBox17);
		this.GroupBox9.Controls.Add(this.Label27);
		this.GroupBox9.Controls.Add(this.TextBox28);
		this.GroupBox9.Controls.Add(this.TextBox2);
		this.GroupBox9.Controls.Add(this.Label17);
		this.GroupBox9.Controls.Add(this.Label3);
		resources.ApplyResources(this.GroupBox9, "GroupBox9");
		this.GroupBox9.Name = "GroupBox9";
		this.GroupBox9.TabStop = false;
		resources.ApplyResources(this.NumericUpDown2, "NumericUpDown2");
		this.NumericUpDown2.Maximum = new decimal(new int[4] { 4, 0, 0, 0 });
		this.NumericUpDown2.Minimum = new decimal(new int[4] { 1, 0, 0, 0 });
		this.NumericUpDown2.Name = "NumericUpDown2";
		this.NumericUpDown2.Value = new decimal(new int[4] { 1, 0, 0, 0 });
		resources.ApplyResources(this.CheckBox5, "CheckBox5");
		this.CheckBox5.Name = "CheckBox5";
		this.CheckBox5.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.Label44, "Label44");
		this.Label44.Name = "Label44";
		this.TextBox27.BackColor = System.Drawing.SystemColors.ButtonHighlight;
		resources.ApplyResources(this.TextBox27, "TextBox27");
		this.TextBox27.Name = "TextBox27";
		this.TextBox27.ReadOnly = true;
		this.TextBox14.BackColor = System.Drawing.SystemColors.ButtonHighlight;
		resources.ApplyResources(this.TextBox14, "TextBox14");
		this.TextBox14.Name = "TextBox14";
		this.TextBox14.ReadOnly = true;
		resources.ApplyResources(this.Label29, "Label29");
		this.Label29.Name = "Label29";
		resources.ApplyResources(this.Label1, "Label1");
		this.Label1.Name = "Label1";
		resources.ApplyResources(this.Label28, "Label28");
		this.Label28.Name = "Label28";
		this.TextBox17.BackColor = System.Drawing.SystemColors.ButtonHighlight;
		resources.ApplyResources(this.TextBox17, "TextBox17");
		this.TextBox17.Name = "TextBox17";
		this.TextBox17.ReadOnly = true;
		resources.ApplyResources(this.Label27, "Label27");
		this.Label27.Name = "Label27";
		this.TextBox28.BackColor = System.Drawing.SystemColors.ButtonHighlight;
		resources.ApplyResources(this.TextBox28, "TextBox28");
		this.TextBox28.Name = "TextBox28";
		this.TextBox28.ReadOnly = true;
		this.TextBox2.BackColor = System.Drawing.SystemColors.ButtonHighlight;
		resources.ApplyResources(this.TextBox2, "TextBox2");
		this.TextBox2.Name = "TextBox2";
		this.TextBox2.ReadOnly = true;
		resources.ApplyResources(this.Label17, "Label17");
		this.Label17.Name = "Label17";
		resources.ApplyResources(this.Label3, "Label3");
		this.Label3.Name = "Label3";
		resources.ApplyResources(this.Label45, "Label45");
		this.Label45.Name = "Label45";
		resources.ApplyResources(this.NumericUpDown1, "NumericUpDown1");
		this.NumericUpDown1.Name = "NumericUpDown1";
		this.Button10.Image = IncliGraph_V1._1_Pro.My.Resources.Resources.magnifying_glass_searcher;
		resources.ApplyResources(this.Button10, "Button10");
		this.Button10.Name = "Button10";
		this.Button10.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.TextBox9, "TextBox9");
		this.TextBox9.Name = "TextBox9";
		resources.ApplyResources(this.CheckBox9, "CheckBox9");
		this.CheckBox9.Name = "CheckBox9";
		this.CheckBox9.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.Button2, "Button2");
		this.Button2.Name = "Button2";
		this.Button2.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.TextBox23, "TextBox23");
		this.TextBox23.Name = "TextBox23";
		resources.ApplyResources(this.Label23, "Label23");
		this.Label23.Name = "Label23";
		this.GroupBox10.Controls.Add(this.Label23);
		this.GroupBox10.Controls.Add(this.TextBox23);
		resources.ApplyResources(this.GroupBox10, "GroupBox10");
		this.GroupBox10.Name = "GroupBox10";
		this.GroupBox10.TabStop = false;
		this.GroupBox11.Controls.Add(this.TextBox8);
		this.GroupBox11.Controls.Add(this.Label9);
		this.GroupBox11.Controls.Add(this.TextBox7);
		this.GroupBox11.Controls.Add(this.Panel3);
		this.GroupBox11.Controls.Add(this.Label8);
		resources.ApplyResources(this.GroupBox11, "GroupBox11");
		this.GroupBox11.Name = "GroupBox11";
		this.GroupBox11.TabStop = false;
		this.Panel3.BackColor = System.Drawing.Color.Transparent;
		this.Panel3.Controls.Add(this.TextBox15);
		this.Panel3.Controls.Add(this.TextBox16);
		this.Panel3.Controls.Add(this.TextBox10);
		this.Panel3.Controls.Add(this.Label26);
		this.Panel3.Controls.Add(this.TextBox6);
		this.Panel3.Controls.Add(this.Label2);
		this.Panel3.Controls.Add(this.Label5);
		this.Panel3.Controls.Add(this.Label13);
		this.Panel3.ForeColor = System.Drawing.SystemColors.Window;
		resources.ApplyResources(this.Panel3, "Panel3");
		this.Panel3.Name = "Panel3";
		this.TextBox15.BackColor = System.Drawing.SystemColors.ButtonHighlight;
		this.TextBox15.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		resources.ApplyResources(this.TextBox15, "TextBox15");
		this.TextBox15.Name = "TextBox15";
		this.TextBox15.ReadOnly = true;
		this.TextBox16.BackColor = System.Drawing.SystemColors.ButtonHighlight;
		this.TextBox16.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		resources.ApplyResources(this.TextBox16, "TextBox16");
		this.TextBox16.Name = "TextBox16";
		this.TextBox16.ReadOnly = true;
		this.TextBox10.BackColor = System.Drawing.SystemColors.ButtonHighlight;
		this.TextBox10.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		resources.ApplyResources(this.TextBox10, "TextBox10");
		this.TextBox10.Name = "TextBox10";
		this.TextBox10.ReadOnly = true;
		resources.ApplyResources(this.Label26, "Label26");
		this.Label26.BackColor = System.Drawing.Color.Transparent;
		this.Label26.ForeColor = System.Drawing.Color.LightSteelBlue;
		this.Label26.Name = "Label26";
		this.TextBox6.BackColor = System.Drawing.SystemColors.ButtonHighlight;
		this.TextBox6.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		resources.ApplyResources(this.TextBox6, "TextBox6");
		this.TextBox6.Name = "TextBox6";
		this.TextBox6.ReadOnly = true;
		resources.ApplyResources(this.Label2, "Label2");
		this.Label2.BackColor = System.Drawing.Color.Transparent;
		this.Label2.ForeColor = System.Drawing.Color.Orange;
		this.Label2.Name = "Label2";
		resources.ApplyResources(this.Label5, "Label5");
		this.Label5.BackColor = System.Drawing.Color.Transparent;
		this.Label5.ForeColor = System.Drawing.Color.Blue;
		this.Label5.Name = "Label5";
		resources.ApplyResources(this.Label13, "Label13");
		this.Label13.BackColor = System.Drawing.Color.Transparent;
		this.Label13.ForeColor = System.Drawing.Color.Red;
		this.Label13.Name = "Label13";
		this.Panel7.Controls.Add(this.TextBox5);
		this.Panel7.Controls.Add(this.TextBox12);
		this.Panel7.Controls.Add(this.CheckBox3);
		this.Panel7.Controls.Add(this.Label31);
		this.Panel7.Controls.Add(this.Label32);
		resources.ApplyResources(this.Panel7, "Panel7");
		this.Panel7.Name = "Panel7";
		this.TextBox5.BackColor = System.Drawing.Color.White;
		resources.ApplyResources(this.TextBox5, "TextBox5");
		this.TextBox5.Name = "TextBox5";
		this.TextBox5.ReadOnly = true;
		this.TextBox12.BackColor = System.Drawing.Color.White;
		resources.ApplyResources(this.TextBox12, "TextBox12");
		this.TextBox12.Name = "TextBox12";
		this.TextBox12.ReadOnly = true;
		resources.ApplyResources(this.CheckBox3, "CheckBox3");
		this.CheckBox3.Name = "CheckBox3";
		this.CheckBox3.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.Label31, "Label31");
		this.Label31.Name = "Label31";
		resources.ApplyResources(this.Label32, "Label32");
		this.Label32.Name = "Label32";
		resources.ApplyResources(this.Label35, "Label35");
		this.Label35.Name = "Label35";
		resources.ApplyResources(this.Label36, "Label36");
		this.Label36.Name = "Label36";
		resources.ApplyResources(this.Label34, "Label34");
		this.Label34.Name = "Label34";
		resources.ApplyResources(this.Button14, "Button14");
		this.Button14.Name = "Button14";
		this.Button14.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.CheckBox4, "CheckBox4");
		this.CheckBox4.Checked = true;
		this.CheckBox4.CheckState = System.Windows.Forms.CheckState.Checked;
		this.CheckBox4.Name = "CheckBox4";
		this.CheckBox4.UseVisualStyleBackColor = true;
		this.TextBox11.BackColor = System.Drawing.Color.White;
		resources.ApplyResources(this.TextBox11, "TextBox11");
		this.TextBox11.Name = "TextBox11";
		this.TextBox11.ReadOnly = true;
		resources.ApplyResources(this.CheckBox2, "CheckBox2");
		this.CheckBox2.Checked = true;
		this.CheckBox2.CheckState = System.Windows.Forms.CheckState.Checked;
		this.CheckBox2.Name = "CheckBox2";
		this.CheckBox2.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.RadioButton2, "RadioButton2");
		this.RadioButton2.Name = "RadioButton2";
		this.RadioButton2.TabStop = true;
		this.RadioButton2.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.Label25, "Label25");
		this.Label25.BackColor = System.Drawing.Color.White;
		this.Label25.Name = "Label25";
		resources.ApplyResources(this.ProgressBar1, "ProgressBar1");
		this.ProgressBar1.Maximum = 120;
		this.ProgressBar1.Name = "ProgressBar1";
		this.ProgressBar1.Style = System.Windows.Forms.ProgressBarStyle.Continuous;
		this.TextBox13.BackColor = System.Drawing.Color.White;
		this.TextBox13.BorderStyle = System.Windows.Forms.BorderStyle.None;
		resources.ApplyResources(this.TextBox13, "TextBox13");
		this.TextBox13.Name = "TextBox13";
		this.TextBox13.ReadOnly = true;
		resources.ApplyResources(this.Label22, "Label22");
		this.Label22.BackColor = System.Drawing.Color.Red;
		this.Label22.ForeColor = System.Drawing.Color.White;
		this.Label22.Name = "Label22";
		this.ListBox1.FormattingEnabled = true;
		resources.ApplyResources(this.ListBox1, "ListBox1");
		this.ListBox1.Name = "ListBox1";
		resources.ApplyResources(this.Label24, "Label24");
		this.Label24.Name = "Label24";
		this.MonthCalendar1.BackColor = System.Drawing.Color.White;
		resources.ApplyResources(this.MonthCalendar1, "MonthCalendar1");
		this.MonthCalendar1.MaxSelectionCount = 1;
		this.MonthCalendar1.Name = "MonthCalendar1";
		this.MonthCalendar1.ShowToday = false;
		resources.ApplyResources(this.Label12, "Label12");
		this.Label12.Name = "Label12";
		this.ListBox2.DisplayMember = "Id";
		this.ListBox2.FormattingEnabled = true;
		resources.ApplyResources(this.ListBox2, "ListBox2");
		this.ListBox2.Name = "ListBox2";
		this.Panel1.Controls.Add(this.MonthCalendar1);
		this.Panel1.Controls.Add(this.Button12);
		resources.ApplyResources(this.Panel1, "Panel1");
		this.Panel1.Name = "Panel1";
		resources.ApplyResources(this.Button12, "Button12");
		this.Button12.Name = "Button12";
		this.Button12.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.Button5, "Button5");
		this.Button5.Name = "Button5";
		this.Button5.UseVisualStyleBackColor = true;
		this.PictureBox2.BackColor = System.Drawing.Color.White;
		this.PictureBox2.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		resources.ApplyResources(this.PictureBox2, "PictureBox2");
		this.PictureBox2.Name = "PictureBox2";
		this.PictureBox2.TabStop = false;
		this.PictureBox3.BackColor = System.Drawing.Color.White;
		this.PictureBox3.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		resources.ApplyResources(this.PictureBox3, "PictureBox3");
		this.PictureBox3.Name = "PictureBox3";
		this.PictureBox3.TabStop = false;
		this.PictureBox4.BackColor = System.Drawing.Color.White;
		this.PictureBox4.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		resources.ApplyResources(this.PictureBox4, "PictureBox4");
		this.PictureBox4.Name = "PictureBox4";
		this.PictureBox4.TabStop = false;
		resources.ApplyResources(this.PictureBox5, "PictureBox5");
		this.PictureBox5.BackColor = System.Drawing.Color.White;
		this.PictureBox5.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		this.PictureBox5.Image = IncliGraph_V1._1_Pro.My.Resources.Resources.Frontal_0;
		this.PictureBox5.InitialImage = IncliGraph_V1._1_Pro.My.Resources.Resources.Frontal_0;
		this.PictureBox5.Name = "PictureBox5";
		this.PictureBox5.TabStop = false;
		this.Panel2.BackColor = System.Drawing.Color.Transparent;
		this.Panel2.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		this.Panel2.Controls.Add(this.Button17);
		this.Panel2.Controls.Add(this.CheckBox14);
		this.Panel2.Controls.Add(this.CheckBox13);
		this.Panel2.Controls.Add(this.CheckBox12);
		this.Panel2.Controls.Add(this.CheckBox11);
		this.Panel2.Controls.Add(this.CheckBox10);
		this.Panel2.Controls.Add(this.CheckBox8);
		this.Panel2.Controls.Add(this.CheckBox7);
		this.Panel2.Controls.Add(this.TextBox20);
		this.Panel2.Controls.Add(this.TextBox21);
		this.Panel2.Controls.Add(this.TextBox1);
		this.Panel2.Controls.Add(this.Label30);
		this.Panel2.Controls.Add(this.Label18);
		this.Panel2.Controls.Add(this.TextBox18);
		this.Panel2.Controls.Add(this.TextBox29);
		this.Panel2.Controls.Add(this.TextBox22);
		this.Panel2.Controls.Add(this.Label16);
		this.Panel2.Controls.Add(this.Label19);
		this.Panel2.Controls.Add(this.TextBox19);
		this.Panel2.Controls.Add(this.Label20);
		this.Panel2.Controls.Add(this.Label6);
		this.Panel2.Controls.Add(this.Label10);
		resources.ApplyResources(this.Panel2, "Panel2");
		this.Panel2.Name = "Panel2";
		this.Button17.Image = IncliGraph_V1._1_Pro.My.Resources.Resources.hide;
		resources.ApplyResources(this.Button17, "Button17");
		this.Button17.Name = "Button17";
		this.Button17.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.CheckBox14, "CheckBox14");
		this.CheckBox14.Name = "CheckBox14";
		this.CheckBox14.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.CheckBox13, "CheckBox13");
		this.CheckBox13.Checked = true;
		this.CheckBox13.CheckState = System.Windows.Forms.CheckState.Checked;
		this.CheckBox13.Name = "CheckBox13";
		this.CheckBox13.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.CheckBox12, "CheckBox12");
		this.CheckBox12.Name = "CheckBox12";
		this.CheckBox12.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.CheckBox11, "CheckBox11");
		this.CheckBox11.Name = "CheckBox11";
		this.CheckBox11.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.CheckBox10, "CheckBox10");
		this.CheckBox10.Checked = true;
		this.CheckBox10.CheckState = System.Windows.Forms.CheckState.Checked;
		this.CheckBox10.Name = "CheckBox10";
		this.CheckBox10.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.CheckBox8, "CheckBox8");
		this.CheckBox8.Checked = true;
		this.CheckBox8.CheckState = System.Windows.Forms.CheckState.Checked;
		this.CheckBox8.Name = "CheckBox8";
		this.CheckBox8.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.CheckBox7, "CheckBox7");
		this.CheckBox7.Checked = true;
		this.CheckBox7.CheckState = System.Windows.Forms.CheckState.Checked;
		this.CheckBox7.Name = "CheckBox7";
		this.CheckBox7.UseVisualStyleBackColor = true;
		this.TextBox20.BackColor = System.Drawing.SystemColors.ButtonHighlight;
		this.TextBox20.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		resources.ApplyResources(this.TextBox20, "TextBox20");
		this.TextBox20.Name = "TextBox20";
		this.TextBox20.ReadOnly = true;
		this.TextBox21.BackColor = System.Drawing.SystemColors.ButtonHighlight;
		this.TextBox21.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		resources.ApplyResources(this.TextBox21, "TextBox21");
		this.TextBox21.Name = "TextBox21";
		this.TextBox21.ReadOnly = true;
		this.TextBox1.BackColor = System.Drawing.SystemColors.ButtonHighlight;
		this.TextBox1.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		resources.ApplyResources(this.TextBox1, "TextBox1");
		this.TextBox1.Name = "TextBox1";
		this.TextBox1.ReadOnly = true;
		resources.ApplyResources(this.Label30, "Label30");
		this.Label30.BackColor = System.Drawing.Color.Transparent;
		this.Label30.ForeColor = System.Drawing.Color.Black;
		this.Label30.Name = "Label30";
		resources.ApplyResources(this.Label18, "Label18");
		this.Label18.BackColor = System.Drawing.Color.Transparent;
		this.Label18.ForeColor = System.Drawing.Color.Orange;
		this.Label18.Name = "Label18";
		this.TextBox18.BackColor = System.Drawing.SystemColors.ButtonHighlight;
		this.TextBox18.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		resources.ApplyResources(this.TextBox18, "TextBox18");
		this.TextBox18.Name = "TextBox18";
		this.TextBox18.ReadOnly = true;
		this.TextBox29.BackColor = System.Drawing.SystemColors.ButtonHighlight;
		this.TextBox29.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		resources.ApplyResources(this.TextBox29, "TextBox29");
		this.TextBox29.Name = "TextBox29";
		this.TextBox29.ReadOnly = true;
		this.TextBox22.BackColor = System.Drawing.SystemColors.ButtonHighlight;
		this.TextBox22.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		resources.ApplyResources(this.TextBox22, "TextBox22");
		this.TextBox22.Name = "TextBox22";
		this.TextBox22.ReadOnly = true;
		resources.ApplyResources(this.Label16, "Label16");
		this.Label16.BackColor = System.Drawing.Color.Transparent;
		this.Label16.ForeColor = System.Drawing.Color.Orange;
		this.Label16.Name = "Label16";
		resources.ApplyResources(this.Label19, "Label19");
		this.Label19.BackColor = System.Drawing.Color.Transparent;
		this.Label19.ForeColor = System.Drawing.Color.Blue;
		this.Label19.Name = "Label19";
		this.TextBox19.BackColor = System.Drawing.SystemColors.ButtonHighlight;
		this.TextBox19.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		resources.ApplyResources(this.TextBox19, "TextBox19");
		this.TextBox19.Name = "TextBox19";
		this.TextBox19.ReadOnly = true;
		resources.ApplyResources(this.Label20, "Label20");
		this.Label20.BackColor = System.Drawing.Color.Transparent;
		this.Label20.ForeColor = System.Drawing.Color.Red;
		this.Label20.Name = "Label20";
		resources.ApplyResources(this.Label6, "Label6");
		this.Label6.BackColor = System.Drawing.Color.Transparent;
		this.Label6.ForeColor = System.Drawing.Color.Blue;
		this.Label6.Name = "Label6";
		resources.ApplyResources(this.Label10, "Label10");
		this.Label10.BackColor = System.Drawing.Color.Transparent;
		this.Label10.ForeColor = System.Drawing.Color.Red;
		this.Label10.Name = "Label10";
		this.Panel4.BackColor = System.Drawing.Color.DarkGray;
		this.Panel4.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		resources.ApplyResources(this.Panel4, "Panel4");
		this.Panel4.Name = "Panel4";
		resources.ApplyResources(this.Button6, "Button6");
		this.Button6.Name = "Button6";
		this.Button6.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.Button7, "Button7");
		this.Button7.Name = "Button7";
		this.Button7.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.Button9, "Button9");
		this.Button9.Name = "Button9";
		this.Button9.UseVisualStyleBackColor = true;
		this.PictureBox6.BackColor = System.Drawing.Color.White;
		this.PictureBox6.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		this.PictureBox6.Image = IncliGraph_V1._1_Pro.My.Resources.Resources.Lateral_0;
		this.PictureBox6.InitialImage = IncliGraph_V1._1_Pro.My.Resources.Resources.Lateral_0;
		resources.ApplyResources(this.PictureBox6, "PictureBox6");
		this.PictureBox6.Name = "PictureBox6";
		this.PictureBox6.TabStop = false;
		this.TrackBar1.BackColor = System.Drawing.SystemColors.Control;
		resources.ApplyResources(this.TrackBar1, "TrackBar1");
		this.TrackBar1.Maximum = 75;
		this.TrackBar1.Name = "TrackBar1";
		this.TrackBar1.SmallChange = 5;
		this.TrackBar1.TickFrequency = 10;
		resources.ApplyResources(this.TextBox24, "TextBox24");
		this.TextBox24.Name = "TextBox24";
		resources.ApplyResources(this.Button13, "Button13");
		this.Button13.Name = "Button13";
		this.Button13.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.Label14, "Label14");
		this.Label14.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		this.Label14.Name = "Label14";
		resources.ApplyResources(this.Label11, "Label11");
		this.Label11.BackColor = System.Drawing.SystemColors.Control;
		this.Label11.Name = "Label11";
		resources.ApplyResources(this.Label21, "Label21");
		this.Label21.BackColor = System.Drawing.SystemColors.Control;
		this.Label21.Name = "Label21";
		resources.ApplyResources(this.Label4, "Label4");
		this.Label4.BackColor = System.Drawing.SystemColors.Control;
		this.Label4.Name = "Label4";
		resources.ApplyResources(this.CheckBox1, "CheckBox1");
		this.CheckBox1.Name = "CheckBox1";
		this.CheckBox1.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.Label7, "Label7");
		this.Label7.Name = "Label7";
		resources.ApplyResources(this.Label15, "Label15");
		this.Label15.Name = "Label15";
		resources.ApplyResources(this.Label33, "Label33");
		this.Label33.Name = "Label33";
		this.ComboBox1.FormattingEnabled = true;
		resources.ApplyResources(this.ComboBox1, "ComboBox1");
		this.ComboBox1.Name = "ComboBox1";
		resources.ApplyResources(this.GroupBox1, "GroupBox1");
		this.GroupBox1.Name = "GroupBox1";
		this.GroupBox1.TabStop = false;
		this.PictureBox7.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		this.PictureBox7.Image = IncliGraph_V1._1_Pro.My.Resources.Resources.Vertical_220T;
		this.PictureBox7.InitialImage = IncliGraph_V1._1_Pro.My.Resources.Resources.Vertical_220T;
		resources.ApplyResources(this.PictureBox7, "PictureBox7");
		this.PictureBox7.Name = "PictureBox7";
		this.PictureBox7.TabStop = false;
		this.Panel5.BackColor = System.Drawing.Color.DarkGray;
		this.Panel5.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		this.Panel5.Controls.Add(this.Label39);
		this.Panel5.Controls.Add(this.Label38);
		this.Panel5.Controls.Add(this.Label37);
		resources.ApplyResources(this.Panel5, "Panel5");
		this.Panel5.Name = "Panel5";
		resources.ApplyResources(this.Label39, "Label39");
		this.Label39.BackColor = System.Drawing.Color.DarkGray;
		this.Label39.ForeColor = System.Drawing.Color.White;
		this.Label39.Name = "Label39";
		resources.ApplyResources(this.Label38, "Label38");
		this.Label38.BackColor = System.Drawing.Color.DarkGray;
		this.Label38.ForeColor = System.Drawing.Color.White;
		this.Label38.Name = "Label38";
		resources.ApplyResources(this.Label37, "Label37");
		this.Label37.BackColor = System.Drawing.Color.DarkGray;
		this.Label37.ForeColor = System.Drawing.Color.White;
		this.Label37.Name = "Label37";
		this.Panel6.BackColor = System.Drawing.Color.DarkGray;
		this.Panel6.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		this.Panel6.Controls.Add(this.Label42);
		this.Panel6.Controls.Add(this.Label40);
		this.Panel6.Controls.Add(this.Label41);
		resources.ApplyResources(this.Panel6, "Panel6");
		this.Panel6.Name = "Panel6";
		resources.ApplyResources(this.Label42, "Label42");
		this.Label42.BackColor = System.Drawing.Color.DarkGray;
		this.Label42.ForeColor = System.Drawing.Color.White;
		this.Label42.Name = "Label42";
		resources.ApplyResources(this.Label40, "Label40");
		this.Label40.BackColor = System.Drawing.Color.DarkGray;
		this.Label40.ForeColor = System.Drawing.Color.White;
		this.Label40.Name = "Label40";
		resources.ApplyResources(this.Label41, "Label41");
		this.Label41.BackColor = System.Drawing.Color.DarkGray;
		this.Label41.ForeColor = System.Drawing.Color.White;
		this.Label41.Name = "Label41";
		resources.ApplyResources(this.RadioButton1, "RadioButton1");
		this.RadioButton1.Name = "RadioButton1";
		this.RadioButton1.TabStop = true;
		this.RadioButton1.UseVisualStyleBackColor = true;
		this.ComboBox2.FormattingEnabled = true;
		this.ComboBox2.Items.AddRange(new object[2]
		{
			resources.GetString("ComboBox2.Items"),
			resources.GetString("ComboBox2.Items1")
		});
		resources.ApplyResources(this.ComboBox2, "ComboBox2");
		this.ComboBox2.Name = "ComboBox2";
		resources.ApplyResources(this.Label43, "Label43");
		this.Label43.BackColor = System.Drawing.Color.Black;
		this.Label43.ForeColor = System.Drawing.Color.White;
		this.Label43.Name = "Label43";
		this.Panel8.BackColor = System.Drawing.Color.White;
		this.Panel8.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		this.Panel8.Controls.Add(this.ProgressBar1);
		this.Panel8.Controls.Add(this.TextBox13);
		this.Panel8.Controls.Add(this.Label25);
		resources.ApplyResources(this.Panel8, "Panel8");
		this.Panel8.Name = "Panel8";
		this.PictureBox8.BackColor = System.Drawing.Color.White;
		resources.ApplyResources(this.PictureBox8, "PictureBox8");
		this.PictureBox8.Name = "PictureBox8";
		this.PictureBox8.TabStop = false;
		this.PictureBox9.BackColor = System.Drawing.Color.White;
		this.PictureBox9.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		resources.ApplyResources(this.PictureBox9, "PictureBox9");
		this.PictureBox9.Name = "PictureBox9";
		this.PictureBox9.TabStop = false;
		this.RGBindingSource.DataMember = "RG";
		this.RGBindingSource.DataSource = this.VehiculosDataSet;
		this.VehiculosDataSet.DataSetName = "VehiculosDataSet";
		this.VehiculosDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.RGTableAdapter.ClearBeforeFill = true;
		this.DatosDataSet.DataSetName = "DatosDataSet";
		this.DatosDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.DescargasBindingSource.DataMember = "Descargas";
		this.DescargasBindingSource.DataSource = this.DatosDataSet;
		this.DescargasTableAdapter.ClearBeforeFill = true;
		this.GroupBox2.Controls.Add(this.Button19);
		this.GroupBox2.Controls.Add(this.NumericUpDown1);
		this.GroupBox2.Controls.Add(this.Button10);
		resources.ApplyResources(this.GroupBox2, "GroupBox2");
		this.GroupBox2.Name = "GroupBox2";
		this.GroupBox2.TabStop = false;
		this.Button19.Image = IncliGraph_V1._1_Pro.My.Resources.Resources.floppy_disk;
		resources.ApplyResources(this.Button19, "Button19");
		this.Button19.Name = "Button19";
		this.Button19.UseVisualStyleBackColor = true;
		this.GroupBox3.Controls.Add(this.TextBox25);
		this.GroupBox3.Controls.Add(this.CheckBox6);
		this.GroupBox3.Controls.Add(this.CheckBox15);
		this.GroupBox3.Controls.Add(this.CheckBox16);
		this.GroupBox3.Controls.Add(this.Button16);
		this.GroupBox3.Controls.Add(this.GroupBox4);
		this.GroupBox3.Controls.Add(this.Button15);
		this.GroupBox3.Controls.Add(this.ComboBox2);
		this.GroupBox3.Controls.Add(this.CheckBox1);
		this.GroupBox3.Controls.Add(this.CheckBox2);
		this.GroupBox3.Controls.Add(this.CheckBox4);
		this.GroupBox3.Controls.Add(this.CheckBox9);
		this.GroupBox3.Controls.Add(this.Label11);
		this.GroupBox3.Controls.Add(this.Label21);
		this.GroupBox3.Controls.Add(this.Label4);
		this.GroupBox3.Controls.Add(this.TrackBar1);
		resources.ApplyResources(this.GroupBox3, "GroupBox3");
		this.GroupBox3.Name = "GroupBox3";
		this.GroupBox3.TabStop = false;
		resources.ApplyResources(this.TextBox25, "TextBox25");
		this.TextBox25.Name = "TextBox25";
		resources.ApplyResources(this.CheckBox6, "CheckBox6");
		this.CheckBox6.Checked = true;
		this.CheckBox6.CheckState = System.Windows.Forms.CheckState.Checked;
		this.CheckBox6.Name = "CheckBox6";
		this.CheckBox6.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.CheckBox15, "CheckBox15");
		this.CheckBox15.Checked = true;
		this.CheckBox15.CheckState = System.Windows.Forms.CheckState.Checked;
		this.CheckBox15.Name = "CheckBox15";
		this.CheckBox15.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.CheckBox16, "CheckBox16");
		this.CheckBox16.Checked = true;
		this.CheckBox16.CheckState = System.Windows.Forms.CheckState.Checked;
		this.CheckBox16.Name = "CheckBox16";
		this.CheckBox16.UseVisualStyleBackColor = true;
		this.Button16.Image = IncliGraph_V1._1_Pro.My.Resources.Resources.night;
		resources.ApplyResources(this.Button16, "Button16");
		this.Button16.Name = "Button16";
		this.Button16.UseVisualStyleBackColor = true;
		this.GroupBox4.Controls.Add(this.Panel7);
		this.GroupBox4.Controls.Add(this.Label36);
		this.GroupBox4.Controls.Add(this.Button14);
		this.GroupBox4.Controls.Add(this.TextBox4);
		this.GroupBox4.Controls.Add(this.Label35);
		this.GroupBox4.Controls.Add(this.TextBox9);
		this.GroupBox4.Controls.Add(this.Label34);
		this.GroupBox4.Controls.Add(this.TextBox11);
		this.GroupBox4.Controls.Add(this.RadioButton2);
		this.GroupBox4.Controls.Add(this.RadioButton1);
		this.GroupBox4.Controls.Add(this.TextBox24);
		resources.ApplyResources(this.GroupBox4, "GroupBox4");
		this.GroupBox4.Name = "GroupBox4";
		this.GroupBox4.TabStop = false;
		resources.ApplyResources(this.Button15, "Button15");
		this.Button15.Name = "Button15";
		this.Button15.UseVisualStyleBackColor = true;
		this.Button11.Image = IncliGraph_V1._1_Pro.My.Resources.Resources.gear_settings;
		resources.ApplyResources(this.Button11, "Button11");
		this.Button11.Name = "Button11";
		this.Button11.UseVisualStyleBackColor = true;
		this.Button18.Image = IncliGraph_V1._1_Pro.My.Resources.Resources.clipboard;
		resources.ApplyResources(this.Button18, "Button18");
		this.Button18.Name = "Button18";
		this.Button18.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PictureBox10, "PictureBox10");
		this.PictureBox10.Name = "PictureBox10";
		this.PictureBox10.TabStop = false;
		resources.ApplyResources(this.PictureBox11, "PictureBox11");
		this.PictureBox11.Name = "PictureBox11";
		this.PictureBox11.TabStop = false;
		resources.ApplyResources(this.PictureBox12, "PictureBox12");
		this.PictureBox12.Name = "PictureBox12";
		this.PictureBox12.TabStop = false;
		resources.ApplyResources(this.PictureBox13, "PictureBox13");
		this.PictureBox13.Name = "PictureBox13";
		this.PictureBox13.TabStop = false;
		resources.ApplyResources(this.PictureBox14, "PictureBox14");
		this.PictureBox14.Name = "PictureBox14";
		this.PictureBox14.TabStop = false;
		resources.ApplyResources(this.PictureBox15, "PictureBox15");
		this.PictureBox15.Name = "PictureBox15";
		this.PictureBox15.TabStop = false;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		this.BackColor = System.Drawing.SystemColors.Control;
		base.Controls.Add(this.Label45);
		base.Controls.Add(this.PictureBox13);
		base.Controls.Add(this.PictureBox14);
		base.Controls.Add(this.PictureBox15);
		base.Controls.Add(this.PictureBox12);
		base.Controls.Add(this.PictureBox11);
		base.Controls.Add(this.PictureBox10);
		base.Controls.Add(this.Button11);
		base.Controls.Add(this.GroupBox3);
		base.Controls.Add(this.Panel2);
		base.Controls.Add(this.Label14);
		base.Controls.Add(this.GroupBox2);
		base.Controls.Add(this.PictureBox9);
		base.Controls.Add(this.PictureBox8);
		base.Controls.Add(this.Panel8);
		base.Controls.Add(this.Button2);
		base.Controls.Add(this.Panel6);
		base.Controls.Add(this.Panel5);
		base.Controls.Add(this.PictureBox7);
		base.Controls.Add(this.ComboBox1);
		base.Controls.Add(this.Label15);
		base.Controls.Add(this.Label7);
		base.Controls.Add(this.GroupBox9);
		base.Controls.Add(this.Button13);
		base.Controls.Add(this.Label43);
		base.Controls.Add(this.Label22);
		base.Controls.Add(this.PictureBox6);
		base.Controls.Add(this.Button9);
		base.Controls.Add(this.GroupBox10);
		base.Controls.Add(this.Button7);
		base.Controls.Add(this.Button6);
		base.Controls.Add(this.PictureBox5);
		base.Controls.Add(this.PictureBox3);
		base.Controls.Add(this.PictureBox2);
		base.Controls.Add(this.Button5);
		base.Controls.Add(this.Panel1);
		base.Controls.Add(this.ListBox2);
		base.Controls.Add(this.ListBox1);
		base.Controls.Add(this.Button1);
		base.Controls.Add(this.Label12);
		base.Controls.Add(this.Label33);
		base.Controls.Add(this.Label24);
		base.Controls.Add(this.GroupBox11);
		base.Controls.Add(this.Button8);
		base.Controls.Add(this.HScrollBar1);
		base.Controls.Add(this.Button4);
		base.Controls.Add(this.Button3);
		base.Controls.Add(this.PictureBox1);
		base.Controls.Add(this.Panel4);
		base.Controls.Add(this.PictureBox4);
		base.Controls.Add(this.GroupBox1);
		base.Controls.Add(this.Button18);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.Fixed3D;
		base.Name = "Form1";
		base.ShowIcon = false;
		base.WindowState = System.Windows.Forms.FormWindowState.Maximized;
		((System.ComponentModel.ISupportInitialize)this.PictureBox1).EndInit();
		this.GroupBox9.ResumeLayout(false);
		this.GroupBox9.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.NumericUpDown2).EndInit();
		((System.ComponentModel.ISupportInitialize)this.NumericUpDown1).EndInit();
		this.GroupBox10.ResumeLayout(false);
		this.GroupBox10.PerformLayout();
		this.GroupBox11.ResumeLayout(false);
		this.GroupBox11.PerformLayout();
		this.Panel3.ResumeLayout(false);
		this.Panel3.PerformLayout();
		this.Panel7.ResumeLayout(false);
		this.Panel7.PerformLayout();
		this.Panel1.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.PictureBox2).EndInit();
		((System.ComponentModel.ISupportInitialize)this.PictureBox3).EndInit();
		((System.ComponentModel.ISupportInitialize)this.PictureBox4).EndInit();
		((System.ComponentModel.ISupportInitialize)this.PictureBox5).EndInit();
		this.Panel2.ResumeLayout(false);
		this.Panel2.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.PictureBox6).EndInit();
		((System.ComponentModel.ISupportInitialize)this.TrackBar1).EndInit();
		((System.ComponentModel.ISupportInitialize)this.PictureBox7).EndInit();
		this.Panel5.ResumeLayout(false);
		this.Panel5.PerformLayout();
		this.Panel6.ResumeLayout(false);
		this.Panel6.PerformLayout();
		this.Panel8.ResumeLayout(false);
		this.Panel8.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.PictureBox8).EndInit();
		((System.ComponentModel.ISupportInitialize)this.PictureBox9).EndInit();
		((System.ComponentModel.ISupportInitialize)this.RGBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.VehiculosDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.DatosDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.DescargasBindingSource).EndInit();
		this.GroupBox2.ResumeLayout(false);
		this.GroupBox3.ResumeLayout(false);
		this.GroupBox3.PerformLayout();
		this.GroupBox4.ResumeLayout(false);
		this.GroupBox4.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.PictureBox10).EndInit();
		((System.ComponentModel.ISupportInitialize)this.PictureBox11).EndInit();
		((System.ComponentModel.ISupportInitialize)this.PictureBox12).EndInit();
		((System.ComponentModel.ISupportInitialize)this.PictureBox13).EndInit();
		((System.ComponentModel.ISupportInitialize)this.PictureBox14).EndInit();
		((System.ComponentModel.ISupportInitialize)this.PictureBox15).EndInit();
		base.ResumeLayout(false);
		base.PerformLayout();
	}
}
