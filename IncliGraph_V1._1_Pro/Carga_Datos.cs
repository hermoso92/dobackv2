using System;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Forms;
using IncliGraph_V1._1_Pro.DatosDataSetTableAdapters;
using IncliGraph_V1._1_Pro.My;
using IncliGraph_V1._1_Pro.My.Resources;
using IncliGraph_V1._1_Pro.VehiculosDataSetTableAdapters;
using Microsoft.VisualBasic;
using Microsoft.VisualBasic.CompilerServices;

namespace IncliGraph_V1._1_Pro;

[DesignerGenerated]
public class Carga_Datos : Form
{
	private IContainer components;

	[CompilerGenerated]
	[AccessedThroughProperty("ComboBox1")]
	private ComboBox _ComboBox1;

	[CompilerGenerated]
	[AccessedThroughProperty("ListBox1")]
	private ListBox _ListBox1;

	[CompilerGenerated]
	[AccessedThroughProperty("Button10")]
	private Button _Button10;

	[CompilerGenerated]
	[AccessedThroughProperty("Button5")]
	private Button _Button5;

	[CompilerGenerated]
	[AccessedThroughProperty("Button3")]
	private Button _Button3;

	[CompilerGenerated]
	[AccessedThroughProperty("Button2")]
	private Button _Button2;

	[CompilerGenerated]
	[AccessedThroughProperty("Button7")]
	private Button _Button7;

	[CompilerGenerated]
	[AccessedThroughProperty("Button1")]
	private Button _Button1;

	[CompilerGenerated]
	[AccessedThroughProperty("Label4")]
	private Label _Label4;

	[CompilerGenerated]
	[AccessedThroughProperty("Button8")]
	private Button _Button8;

	[CompilerGenerated]
	[AccessedThroughProperty("Label14")]
	private Label _Label14;

	[CompilerGenerated]
	[AccessedThroughProperty("Button4")]
	private Button _Button4;

	[CompilerGenerated]
	[AccessedThroughProperty("Button6")]
	private Button _Button6;

	[CompilerGenerated]
	[AccessedThroughProperty("Timer1")]
	private System.Windows.Forms.Timer _Timer1;

	[CompilerGenerated]
	[AccessedThroughProperty("Timer2")]
	private System.Windows.Forms.Timer _Timer2;

	[CompilerGenerated]
	[AccessedThroughProperty("Timer3")]
	private System.Windows.Forms.Timer _Timer3;

	private CultureInfo resourceCulture;

	public int conex;

	private int[] datoen;

	private byte envio;

	private int USB_conectado;

	private string Vehiculo;

	private DataRow[] Lista_UCO_carga;

	private string Id;

	private string[] Id_Disp;

	public int T1_1;

	public int T2_1;

	public int T3_1;

	public int T4_1;

	public int T1_2;

	public int T2_2;

	public int T3_2;

	public int T4_2;

	public int config_avan;

	private string dia;

	private string mes;

	private string ano;

	private string horas;

	private string minu;

	private string segu;

	private int dia_semana;

	public float Kx_1;

	public float Ky_1;

	public float Kx_2;

	public float Ky_2;

	private string[] A_1;

	private string[] A_2;

	private string[] B_1;

	private string[] B_2;

	private string[] C_1;

	private string[] C_2;

	private string[] D_1;

	private string[] D_2;

	private string[] E_1;

	private string[] E_2;

	private string[] F_1;

	private string[] F_2;

	private string[] G_1;

	private string[] G_2;

	private string[] H_1;

	private string[] H_2;

	private string[] KX1;

	private string[] KX2;

	private string[] KY1;

	private string[] KY2;

	public float KA_1;

	public float KG_1;

	public float KA_2;

	public float KG_2;

	private string[] KA1;

	private string[] KG1;

	private string[] KA2;

	private string[] KG2;

	public string log2;

	private string NL;

	public string Estado_Datos_Cargados;

	private int chiva;

	private int ocultamsg;

	private string fecha_cargada;

	private string hora_cargada;

	private string dia_semana_cargado;

	private const int VendorID = 957;

	private const int ProductID = 13;

	private const int BufferInSize = 64;

	private const int BufferOutSize = 64;

	private byte[] BufferIn;

	private byte[] BufferOut;

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

	[field: AccessedThroughProperty("Label12")]
	internal virtual Label Label12
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

	[field: AccessedThroughProperty("PictureBox1")]
	internal virtual PictureBox PictureBox1
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

	[field: AccessedThroughProperty("Button9")]
	internal virtual Button Button9
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

	[field: AccessedThroughProperty("GroupBox2")]
	internal virtual GroupBox GroupBox2
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

	[field: AccessedThroughProperty("Label3")]
	internal virtual Label Label3
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("GroupBox5")]
	internal virtual GroupBox GroupBox5
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
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

	[field: AccessedThroughProperty("GroupBox4")]
	internal virtual GroupBox GroupBox4
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

	[field: AccessedThroughProperty("ProgressBar1")]
	internal virtual ProgressBar ProgressBar1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
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

	[field: AccessedThroughProperty("GroupBox3")]
	internal virtual GroupBox GroupBox3
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

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
			Button button = _Button1;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button1 = value;
			button = _Button1;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	[field: AccessedThroughProperty("Label5")]
	internal virtual Label Label5
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual Label Label4
	{
		[CompilerGenerated]
		get
		{
			return _Label4;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Label4_Click;
			Label label = _Label4;
			if (label != null)
			{
				label.Click -= value2;
			}
			_Label4 = value;
			label = _Label4;
			if (label != null)
			{
				label.Click += value2;
			}
		}
	}

	[field: AccessedThroughProperty("GroupBox1")]
	internal virtual GroupBox GroupBox1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
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

	[field: AccessedThroughProperty("TextBox7")]
	internal virtual TextBox TextBox7
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

	[field: AccessedThroughProperty("TextBox5")]
	internal virtual TextBox TextBox5
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

	[field: AccessedThroughProperty("TextBox4")]
	internal virtual TextBox TextBox4
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

	[field: AccessedThroughProperty("TextBox3")]
	internal virtual TextBox TextBox3
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

	[field: AccessedThroughProperty("GroupBox6")]
	internal virtual GroupBox GroupBox6
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox_Coeff1")]
	internal virtual TextBox TextBox_Coeff1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox_Alfa1")]
	internal virtual TextBox TextBox_Alfa1
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

	[field: AccessedThroughProperty("Label15")]
	internal virtual Label Label15
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual Label Label14
	{
		[CompilerGenerated]
		get
		{
			return _Label14;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Label14_Click;
			Label label = _Label14;
			if (label != null)
			{
				label.Click -= value2;
			}
			_Label14 = value;
			label = _Label14;
			if (label != null)
			{
				label.Click += value2;
			}
		}
	}

	[field: AccessedThroughProperty("TextBox_D1")]
	internal virtual TextBox TextBox_D1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
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

	[field: AccessedThroughProperty("Label10")]
	internal virtual Label Label10
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

	[field: AccessedThroughProperty("Label9")]
	internal virtual Label Label9
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("GroupBox7")]
	internal virtual GroupBox GroupBox7
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox_Coeff2")]
	internal virtual TextBox TextBox_Coeff2
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

	[field: AccessedThroughProperty("TextBox_Alfa2")]
	internal virtual TextBox TextBox_Alfa2
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox_D2")]
	internal virtual TextBox TextBox_D2
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

	[field: AccessedThroughProperty("Label19")]
	internal virtual Label Label19
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

	[field: AccessedThroughProperty("RGBindingSource2")]
	internal virtual BindingSource RGBindingSource2
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

	internal virtual System.Windows.Forms.Timer Timer2
	{
		[CompilerGenerated]
		get
		{
			return _Timer2;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Timer2_Tick;
			System.Windows.Forms.Timer timer = _Timer2;
			if (timer != null)
			{
				timer.Tick -= value2;
			}
			_Timer2 = value;
			timer = _Timer2;
			if (timer != null)
			{
				timer.Tick += value2;
			}
		}
	}

	internal virtual System.Windows.Forms.Timer Timer3
	{
		[CompilerGenerated]
		get
		{
			return _Timer3;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Timer3_Tick;
			System.Windows.Forms.Timer timer = _Timer3;
			if (timer != null)
			{
				timer.Tick -= value2;
			}
			_Timer3 = value;
			timer = _Timer3;
			if (timer != null)
			{
				timer.Tick += value2;
			}
		}
	}

	[field: AccessedThroughProperty("DatosDataSet")]
	internal virtual DatosDataSet DatosDataSet
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("FechasBindingSource")]
	internal virtual BindingSource FechasBindingSource
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("FechasTableAdapter")]
	internal virtual FechasTableAdapter FechasTableAdapter
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TableAdapterManager1")]
	internal virtual IncliGraph_V1._1_Pro.DatosDataSetTableAdapters.TableAdapterManager TableAdapterManager1
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

	[field: AccessedThroughProperty("TableAdapterManager")]
	internal virtual IncliGraph_V1._1_Pro.VehiculosDataSetTableAdapters.TableAdapterManager TableAdapterManager
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("GroupBox8")]
	internal virtual GroupBox GroupBox8
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	public Carga_Datos()
	{
		base.Load += Form2_Load;
		base.FormClosing += Form2_FormClosing;
		base.FormClosed += Form2_FormClosed;
		conex = 0;
		datoen = new int[65];
		envio = 0;
		USB_conectado = 0;
		Vehiculo = "";
		Id = "";
		Id_Disp = new string[5];
		T1_1 = 30;
		T2_1 = 25;
		T3_1 = 20;
		T4_1 = 15;
		T1_2 = 30;
		T2_2 = 25;
		T3_2 = 20;
		T4_2 = 15;
		config_avan = 1;
		Kx_1 = 2.5f;
		Ky_1 = 2f;
		Kx_2 = 2.5f;
		Ky_2 = 2f;
		A_1 = new string[5];
		A_2 = new string[5];
		B_1 = new string[5];
		B_2 = new string[5];
		C_1 = new string[5];
		C_2 = new string[5];
		D_1 = new string[5];
		D_2 = new string[5];
		E_1 = new string[5];
		E_2 = new string[5];
		F_1 = new string[5];
		F_2 = new string[5];
		G_1 = new string[5];
		G_2 = new string[5];
		H_1 = new string[5];
		H_2 = new string[5];
		KX1 = new string[5];
		KX2 = new string[5];
		KY1 = new string[5];
		KY2 = new string[5];
		KA1 = new string[4];
		KG1 = new string[4];
		KA2 = new string[4];
		KG2 = new string[4];
		log2 = "";
		NL = Environment.NewLine;
		Estado_Datos_Cargados = "";
		ocultamsg = 0;
		BufferIn = new byte[65];
		BufferOut = new byte[65];
		InitializeComponent();
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
		System.ComponentModel.ComponentResourceManager componentResourceManager = new System.ComponentModel.ComponentResourceManager(typeof(IncliGraph_V1._1_Pro.Carga_Datos));
		this.ComboBox1 = new System.Windows.Forms.ComboBox();
		this.ListBox1 = new System.Windows.Forms.ListBox();
		this.Label12 = new System.Windows.Forms.Label();
		this.Label1 = new System.Windows.Forms.Label();
		this.PictureBox1 = new System.Windows.Forms.PictureBox();
		this.Button10 = new System.Windows.Forms.Button();
		this.Button9 = new System.Windows.Forms.Button();
		this.Button5 = new System.Windows.Forms.Button();
		this.GroupBox2 = new System.Windows.Forms.GroupBox();
		this.TextBox1 = new System.Windows.Forms.TextBox();
		this.Label3 = new System.Windows.Forms.Label();
		this.GroupBox5 = new System.Windows.Forms.GroupBox();
		this.Button3 = new System.Windows.Forms.Button();
		this.GroupBox4 = new System.Windows.Forms.GroupBox();
		this.Label2 = new System.Windows.Forms.Label();
		this.ProgressBar1 = new System.Windows.Forms.ProgressBar();
		this.Button2 = new System.Windows.Forms.Button();
		this.Button7 = new System.Windows.Forms.Button();
		this.GroupBox3 = new System.Windows.Forms.GroupBox();
		this.Button1 = new System.Windows.Forms.Button();
		this.Label5 = new System.Windows.Forms.Label();
		this.Label4 = new System.Windows.Forms.Label();
		this.GroupBox1 = new System.Windows.Forms.GroupBox();
		this.TextBox7 = new System.Windows.Forms.TextBox();
		this.Label13 = new System.Windows.Forms.Label();
		this.TextBox5 = new System.Windows.Forms.TextBox();
		this.RGBindingSource2 = new System.Windows.Forms.BindingSource(this.components);
		this.VehiculosDataSet = new IncliGraph_V1._1_Pro.VehiculosDataSet();
		this.TextBox6 = new System.Windows.Forms.TextBox();
		this.TextBox4 = new System.Windows.Forms.TextBox();
		this.TextBox2 = new System.Windows.Forms.TextBox();
		this.TextBox3 = new System.Windows.Forms.TextBox();
		this.Label11 = new System.Windows.Forms.Label();
		this.GroupBox6 = new System.Windows.Forms.GroupBox();
		this.TextBox_Coeff1 = new System.Windows.Forms.TextBox();
		this.TextBox_Alfa1 = new System.Windows.Forms.TextBox();
		this.Label16 = new System.Windows.Forms.Label();
		this.Label15 = new System.Windows.Forms.Label();
		this.Label14 = new System.Windows.Forms.Label();
		this.TextBox_D1 = new System.Windows.Forms.TextBox();
		this.Button4 = new System.Windows.Forms.Button();
		this.Label10 = new System.Windows.Forms.Label();
		this.Label6 = new System.Windows.Forms.Label();
		this.Label9 = new System.Windows.Forms.Label();
		this.GroupBox7 = new System.Windows.Forms.GroupBox();
		this.TextBox_Coeff2 = new System.Windows.Forms.TextBox();
		this.Button6 = new System.Windows.Forms.Button();
		this.TextBox_Alfa2 = new System.Windows.Forms.TextBox();
		this.TextBox_D2 = new System.Windows.Forms.TextBox();
		this.Label17 = new System.Windows.Forms.Label();
		this.Label19 = new System.Windows.Forms.Label();
		this.Label18 = new System.Windows.Forms.Label();
		this.Button8 = new System.Windows.Forms.Button();
		this.Timer1 = new System.Windows.Forms.Timer(this.components);
		this.Timer2 = new System.Windows.Forms.Timer(this.components);
		this.Timer3 = new System.Windows.Forms.Timer(this.components);
		this.DatosDataSet = new IncliGraph_V1._1_Pro.DatosDataSet();
		this.FechasBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.FechasTableAdapter = new IncliGraph_V1._1_Pro.DatosDataSetTableAdapters.FechasTableAdapter();
		this.TableAdapterManager1 = new IncliGraph_V1._1_Pro.DatosDataSetTableAdapters.TableAdapterManager();
		this.RGTableAdapter = new IncliGraph_V1._1_Pro.VehiculosDataSetTableAdapters.RGTableAdapter();
		this.TableAdapterManager = new IncliGraph_V1._1_Pro.VehiculosDataSetTableAdapters.TableAdapterManager();
		this.GroupBox8 = new System.Windows.Forms.GroupBox();
		((System.ComponentModel.ISupportInitialize)this.PictureBox1).BeginInit();
		this.GroupBox2.SuspendLayout();
		this.GroupBox5.SuspendLayout();
		this.GroupBox4.SuspendLayout();
		this.GroupBox3.SuspendLayout();
		this.GroupBox1.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.RGBindingSource2).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.VehiculosDataSet).BeginInit();
		this.GroupBox6.SuspendLayout();
		this.GroupBox7.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.DatosDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.FechasBindingSource).BeginInit();
		this.GroupBox8.SuspendLayout();
		base.SuspendLayout();
		componentResourceManager.ApplyResources(this.ComboBox1, "ComboBox1");
		this.ComboBox1.FormattingEnabled = true;
		this.ComboBox1.Name = "ComboBox1";
		componentResourceManager.ApplyResources(this.ListBox1, "ListBox1");
		this.ListBox1.FormattingEnabled = true;
		this.ListBox1.Name = "ListBox1";
		componentResourceManager.ApplyResources(this.Label12, "Label12");
		this.Label12.Name = "Label12";
		componentResourceManager.ApplyResources(this.Label1, "Label1");
		this.Label1.Name = "Label1";
		componentResourceManager.ApplyResources(this.PictureBox1, "PictureBox1");
		this.PictureBox1.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		this.PictureBox1.Image = IncliGraph_V1._1_Pro.My.Resources.Resources.cabecera_SW;
		this.PictureBox1.Name = "PictureBox1";
		this.PictureBox1.TabStop = false;
		componentResourceManager.ApplyResources(this.Button10, "Button10");
		this.Button10.Name = "Button10";
		this.Button10.UseVisualStyleBackColor = true;
		componentResourceManager.ApplyResources(this.Button9, "Button9");
		this.Button9.Name = "Button9";
		this.Button9.UseVisualStyleBackColor = true;
		componentResourceManager.ApplyResources(this.Button5, "Button5");
		this.Button5.Name = "Button5";
		this.Button5.UseVisualStyleBackColor = true;
		componentResourceManager.ApplyResources(this.GroupBox2, "GroupBox2");
		this.GroupBox2.Controls.Add(this.TextBox1);
		this.GroupBox2.Controls.Add(this.Label3);
		this.GroupBox2.Name = "GroupBox2";
		this.GroupBox2.TabStop = false;
		componentResourceManager.ApplyResources(this.TextBox1, "TextBox1");
		this.TextBox1.Name = "TextBox1";
		componentResourceManager.ApplyResources(this.Label3, "Label3");
		this.Label3.ForeColor = System.Drawing.Color.Red;
		this.Label3.Name = "Label3";
		componentResourceManager.ApplyResources(this.GroupBox5, "GroupBox5");
		this.GroupBox5.Controls.Add(this.Button3);
		this.GroupBox5.Name = "GroupBox5";
		this.GroupBox5.TabStop = false;
		componentResourceManager.ApplyResources(this.Button3, "Button3");
		this.Button3.Name = "Button3";
		this.Button3.UseVisualStyleBackColor = true;
		componentResourceManager.ApplyResources(this.GroupBox4, "GroupBox4");
		this.GroupBox4.Controls.Add(this.Label2);
		this.GroupBox4.Controls.Add(this.ProgressBar1);
		this.GroupBox4.Controls.Add(this.Button2);
		this.GroupBox4.Controls.Add(this.Button7);
		this.GroupBox4.Name = "GroupBox4";
		this.GroupBox4.TabStop = false;
		componentResourceManager.ApplyResources(this.Label2, "Label2");
		this.Label2.ForeColor = System.Drawing.Color.Red;
		this.Label2.Name = "Label2";
		componentResourceManager.ApplyResources(this.ProgressBar1, "ProgressBar1");
		this.ProgressBar1.Name = "ProgressBar1";
		componentResourceManager.ApplyResources(this.Button2, "Button2");
		this.Button2.Name = "Button2";
		this.Button2.UseVisualStyleBackColor = true;
		componentResourceManager.ApplyResources(this.Button7, "Button7");
		this.Button7.Name = "Button7";
		this.Button7.UseVisualStyleBackColor = true;
		componentResourceManager.ApplyResources(this.GroupBox3, "GroupBox3");
		this.GroupBox3.Controls.Add(this.Button1);
		this.GroupBox3.Controls.Add(this.Label5);
		this.GroupBox3.Controls.Add(this.Label4);
		this.GroupBox3.Name = "GroupBox3";
		this.GroupBox3.TabStop = false;
		componentResourceManager.ApplyResources(this.Button1, "Button1");
		this.Button1.Name = "Button1";
		this.Button1.UseVisualStyleBackColor = true;
		componentResourceManager.ApplyResources(this.Label5, "Label5");
		this.Label5.Name = "Label5";
		componentResourceManager.ApplyResources(this.Label4, "Label4");
		this.Label4.ForeColor = System.Drawing.Color.Red;
		this.Label4.Name = "Label4";
		componentResourceManager.ApplyResources(this.GroupBox1, "GroupBox1");
		this.GroupBox1.Controls.Add(this.TextBox7);
		this.GroupBox1.Controls.Add(this.Label13);
		this.GroupBox1.Controls.Add(this.TextBox5);
		this.GroupBox1.Controls.Add(this.TextBox6);
		this.GroupBox1.Controls.Add(this.TextBox4);
		this.GroupBox1.Controls.Add(this.TextBox2);
		this.GroupBox1.Controls.Add(this.TextBox3);
		this.GroupBox1.Controls.Add(this.Label11);
		this.GroupBox1.Controls.Add(this.GroupBox6);
		this.GroupBox1.Controls.Add(this.Label10);
		this.GroupBox1.Controls.Add(this.Label6);
		this.GroupBox1.Controls.Add(this.Label9);
		this.GroupBox1.Controls.Add(this.GroupBox7);
		this.GroupBox1.Name = "GroupBox1";
		this.GroupBox1.TabStop = false;
		componentResourceManager.ApplyResources(this.TextBox7, "TextBox7");
		this.TextBox7.BackColor = System.Drawing.Color.White;
		this.TextBox7.Name = "TextBox7";
		this.TextBox7.ReadOnly = true;
		componentResourceManager.ApplyResources(this.Label13, "Label13");
		this.Label13.Name = "Label13";
		componentResourceManager.ApplyResources(this.TextBox5, "TextBox5");
		this.TextBox5.BackColor = System.Drawing.Color.White;
		this.TextBox5.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource2, "Id_Dispositivo", true));
		this.TextBox5.Name = "TextBox5";
		this.TextBox5.ReadOnly = true;
		this.RGBindingSource2.DataMember = "RG";
		this.RGBindingSource2.DataSource = this.VehiculosDataSet;
		this.VehiculosDataSet.DataSetName = "VehiculosDataSet";
		this.VehiculosDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		componentResourceManager.ApplyResources(this.TextBox6, "TextBox6");
		this.TextBox6.BackColor = System.Drawing.SystemColors.Control;
		this.TextBox6.BorderStyle = System.Windows.Forms.BorderStyle.None;
		this.TextBox6.Name = "TextBox6";
		this.TextBox6.ReadOnly = true;
		componentResourceManager.ApplyResources(this.TextBox4, "TextBox4");
		this.TextBox4.BackColor = System.Drawing.Color.White;
		this.TextBox4.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource2, "Fecha_Carga", true));
		this.TextBox4.Name = "TextBox4";
		this.TextBox4.ReadOnly = true;
		componentResourceManager.ApplyResources(this.TextBox2, "TextBox2");
		this.TextBox2.BackColor = System.Drawing.Color.White;
		this.TextBox2.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource2, "Num_Identificacion", true));
		this.TextBox2.Name = "TextBox2";
		this.TextBox2.ReadOnly = true;
		componentResourceManager.ApplyResources(this.TextBox3, "TextBox3");
		this.TextBox3.BackColor = System.Drawing.Color.White;
		this.TextBox3.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource2, "Matricula", true));
		this.TextBox3.Name = "TextBox3";
		this.TextBox3.ReadOnly = true;
		componentResourceManager.ApplyResources(this.Label11, "Label11");
		this.Label11.Name = "Label11";
		componentResourceManager.ApplyResources(this.GroupBox6, "GroupBox6");
		this.GroupBox6.Controls.Add(this.TextBox_Coeff1);
		this.GroupBox6.Controls.Add(this.TextBox_Alfa1);
		this.GroupBox6.Controls.Add(this.Label16);
		this.GroupBox6.Controls.Add(this.Label15);
		this.GroupBox6.Controls.Add(this.Label14);
		this.GroupBox6.Controls.Add(this.TextBox_D1);
		this.GroupBox6.Controls.Add(this.Button4);
		this.GroupBox6.Name = "GroupBox6";
		this.GroupBox6.TabStop = false;
		componentResourceManager.ApplyResources(this.TextBox_Coeff1, "TextBox_Coeff1");
		this.TextBox_Coeff1.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource2, "COEF1", true));
		this.TextBox_Coeff1.Name = "TextBox_Coeff1";
		componentResourceManager.ApplyResources(this.TextBox_Alfa1, "TextBox_Alfa1");
		this.TextBox_Alfa1.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource2, "ALFA1", true));
		this.TextBox_Alfa1.Name = "TextBox_Alfa1";
		componentResourceManager.ApplyResources(this.Label16, "Label16");
		this.Label16.Name = "Label16";
		componentResourceManager.ApplyResources(this.Label15, "Label15");
		this.Label15.Name = "Label15";
		componentResourceManager.ApplyResources(this.Label14, "Label14");
		this.Label14.Name = "Label14";
		componentResourceManager.ApplyResources(this.TextBox_D1, "TextBox_D1");
		this.TextBox_D1.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource2, "D1", true));
		this.TextBox_D1.Name = "TextBox_D1";
		componentResourceManager.ApplyResources(this.Button4, "Button4");
		this.Button4.Name = "Button4";
		this.Button4.UseVisualStyleBackColor = true;
		componentResourceManager.ApplyResources(this.Label10, "Label10");
		this.Label10.Name = "Label10";
		componentResourceManager.ApplyResources(this.Label6, "Label6");
		this.Label6.Name = "Label6";
		componentResourceManager.ApplyResources(this.Label9, "Label9");
		this.Label9.Name = "Label9";
		componentResourceManager.ApplyResources(this.GroupBox7, "GroupBox7");
		this.GroupBox7.Controls.Add(this.TextBox_Coeff2);
		this.GroupBox7.Controls.Add(this.Button6);
		this.GroupBox7.Controls.Add(this.TextBox_Alfa2);
		this.GroupBox7.Controls.Add(this.TextBox_D2);
		this.GroupBox7.Controls.Add(this.Label17);
		this.GroupBox7.Controls.Add(this.Label19);
		this.GroupBox7.Controls.Add(this.Label18);
		this.GroupBox7.Name = "GroupBox7";
		this.GroupBox7.TabStop = false;
		componentResourceManager.ApplyResources(this.TextBox_Coeff2, "TextBox_Coeff2");
		this.TextBox_Coeff2.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource2, "COEF2", true));
		this.TextBox_Coeff2.Name = "TextBox_Coeff2";
		componentResourceManager.ApplyResources(this.Button6, "Button6");
		this.Button6.Name = "Button6";
		this.Button6.UseVisualStyleBackColor = true;
		componentResourceManager.ApplyResources(this.TextBox_Alfa2, "TextBox_Alfa2");
		this.TextBox_Alfa2.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource2, "ALFA2", true));
		this.TextBox_Alfa2.Name = "TextBox_Alfa2";
		componentResourceManager.ApplyResources(this.TextBox_D2, "TextBox_D2");
		this.TextBox_D2.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource2, "D2", true));
		this.TextBox_D2.Name = "TextBox_D2";
		componentResourceManager.ApplyResources(this.Label17, "Label17");
		this.Label17.Name = "Label17";
		componentResourceManager.ApplyResources(this.Label19, "Label19");
		this.Label19.Name = "Label19";
		componentResourceManager.ApplyResources(this.Label18, "Label18");
		this.Label18.Name = "Label18";
		componentResourceManager.ApplyResources(this.Button8, "Button8");
		this.Button8.Name = "Button8";
		this.Button8.UseVisualStyleBackColor = true;
		this.Timer1.Interval = 300;
		this.Timer2.Interval = 200;
		this.DatosDataSet.DataSetName = "DatosDataSet";
		this.DatosDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.FechasBindingSource.DataMember = "Fechas";
		this.FechasBindingSource.DataSource = this.DatosDataSet;
		this.FechasTableAdapter.ClearBeforeFill = true;
		this.TableAdapterManager1.BackupDataSetBeforeUpdate = false;
		this.TableAdapterManager1.datosappTableAdapter = null;
		this.TableAdapterManager1.DescargasTableAdapter = null;
		this.TableAdapterManager1.FechasTableAdapter = this.FechasTableAdapter;
		this.TableAdapterManager1.UpdateOrder = IncliGraph_V1._1_Pro.DatosDataSetTableAdapters.TableAdapterManager.UpdateOrderOption.InsertUpdateDelete;
		this.RGTableAdapter.ClearBeforeFill = true;
		this.TableAdapterManager.BackupDataSetBeforeUpdate = false;
		this.TableAdapterManager.RGTableAdapter = this.RGTableAdapter;
		this.TableAdapterManager.UpdateOrder = IncliGraph_V1._1_Pro.VehiculosDataSetTableAdapters.TableAdapterManager.UpdateOrderOption.InsertUpdateDelete;
		componentResourceManager.ApplyResources(this.GroupBox8, "GroupBox8");
		this.GroupBox8.Controls.Add(this.Button8);
		this.GroupBox8.Name = "GroupBox8";
		this.GroupBox8.TabStop = false;
		componentResourceManager.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.GroupBox8);
		base.Controls.Add(this.ComboBox1);
		base.Controls.Add(this.ListBox1);
		base.Controls.Add(this.Label12);
		base.Controls.Add(this.Label1);
		base.Controls.Add(this.PictureBox1);
		base.Controls.Add(this.Button10);
		base.Controls.Add(this.Button9);
		base.Controls.Add(this.Button5);
		base.Controls.Add(this.GroupBox2);
		base.Controls.Add(this.GroupBox5);
		base.Controls.Add(this.GroupBox4);
		base.Controls.Add(this.GroupBox3);
		base.Controls.Add(this.GroupBox1);
		base.Name = "Carga_Datos";
		base.ShowIcon = false;
		((System.ComponentModel.ISupportInitialize)this.PictureBox1).EndInit();
		this.GroupBox2.ResumeLayout(false);
		this.GroupBox2.PerformLayout();
		this.GroupBox5.ResumeLayout(false);
		this.GroupBox4.ResumeLayout(false);
		this.GroupBox4.PerformLayout();
		this.GroupBox3.ResumeLayout(false);
		this.GroupBox3.PerformLayout();
		this.GroupBox1.ResumeLayout(false);
		this.GroupBox1.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.RGBindingSource2).EndInit();
		((System.ComponentModel.ISupportInitialize)this.VehiculosDataSet).EndInit();
		this.GroupBox6.ResumeLayout(false);
		this.GroupBox6.PerformLayout();
		this.GroupBox7.ResumeLayout(false);
		this.GroupBox7.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.DatosDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.FechasBindingSource).EndInit();
		this.GroupBox8.ResumeLayout(false);
		base.ResumeLayout(false);
		base.PerformLayout();
	}

	private void Form2_Load(object sender, EventArgs e)
	{
		base.Width = 1040;
		Button1.Text = frases.ResourceManager.GetString("cargando");
		Text = frases.ResourceManager.GetString("cargadatos");
		Label12.Text = frases.ResourceManager.GetString("codigo");
		GroupBox1.Text = frases.ResourceManager.GetString("datosdelvehiculo");
		Label1.Text = frases.ResourceManager.GetString("vehiculo");
		Label6.Text = frases.ResourceManager.GetString("bastidormatricula");
		Label9.Text = frases.ResourceManager.GetString("codigo");
		Label10.Text = frases.ResourceManager.GetString("ultimacarga");
		Label11.Text = frases.ResourceManager.GetString("iddispositivo");
		Label13.Text = frases.ResourceManager.GetString("calendarioinclisafe");
		GroupBox6.Text = frases.ResourceManager.GetString("configpos1selector");
		Button4.Text = frases.ResourceManager.GetString("configavanzada");
		GroupBox7.Text = frases.ResourceManager.GetString("configpos2selector");
		Button6.Text = frases.ResourceManager.GetString("configavanzada");
		GroupBox2.Text = frases.ResourceManager.GetString("iddispositivo");
		Label3.Text = frases.ResourceManager.GetString("iddispositivo");
		GroupBox3.Text = frases.ResourceManager.GetString("paso1conectdisp");
		Label5.Text = frases.ResourceManager.GetString("estadodeldisp");
		Button8.Text = frases.ResourceManager.GetString("actualizarcalendario");
		GroupBox4.Text = frases.ResourceManager.GetString("paso2cargardatosdisp");
		Button2.Text = frases.ResourceManager.GetString("cargadatos");
		Label4.Text = frases.ResourceManager.GetString("noconectado");
		GroupBox5.Text = frases.ResourceManager.GetString("paso3desconectar");
		Button3.Text = frases.ResourceManager.GetString("desconectar");
		Button5.Text = frases.ResourceManager.GetString("volver");
		Button7.Text = frases.ResourceManager.GetString("verdatosdeldisp");
		Button10.Text = frases.ResourceManager.GetString("verlog");
		GroupBox8.Text = frases.ResourceManager.GetString("paso2actualizarcalendario");
		FechasTableAdapter.Fill(DatosDataSet.Fechas);
		RGTableAdapter.Fill(VehiculosDataSet.RG);
		if (RGBindingSource2.Count != 0)
		{
			actualizar_uco();
			actualizar_lista();
			conex = 0;
			Button2.Enabled = false;
			Button3.Enabled = false;
			Button7.Enabled = false;
		}
		else
		{
			Button1.Enabled = false;
			Interaction.MsgBox("No hay vehículos en la base de datos." + NL + "Por favor, agregue un Vehículo a la base de datos" + NL + "antes de proceder con su configuración.", MsgBoxStyle.OkOnly, "Error");
		}
		_ = MyProject.Forms.Principal.user;
		_ = 2;
		Label2.Visible = false;
	}

	private void actualizar_uco()
	{
		if (RGBindingSource2.Count == 0)
		{
			ComboBox1.Items.Clear();
			return;
		}
		ComboBox1.Items.Clear();
		ComboBox1.Items.Add(frases.ResourceManager.GetString("todos"));
		int num = 0;
		checked
		{
			int num2 = RGBindingSource2.Count - 1;
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

	private void actualizar_lista()
	{
		int count = RGBindingSource2.Count;
		if (count == 0)
		{
			ListBox1.Items.Clear();
			return;
		}
		ListBox1.Items.Clear();
		checked
		{
			if (Operators.ConditionalCompareObjectEqual(ComboBox1.SelectedItem, frases.ResourceManager.GetString("todos"), TextCompare: false))
			{
				int num = count - 1;
				for (int i = 0; i <= num; i++)
				{
					RGBindingSource2.Position = i;
					ListBox1.Items.Add(VehiculosDataSet.RG[RGBindingSource2.Position].Matricula);
				}
				ListBox1.SelectedIndex = 0;
				return;
			}
			string filterExpression = "Num_Identificacion like '" + Conversions.ToString(ComboBox1.SelectedItem) + "'";
			Lista_UCO_carga = VehiculosDataSet.RG.Select(filterExpression);
			int num2 = Lista_UCO_carga.Length - 1;
			for (int j = 0; j <= num2; j++)
			{
				ListBox1.Items.Add(Conversions.ToString(Lista_UCO_carga[j][3]));
			}
			ListBox1.SelectedIndex = 0;
		}
	}

	private void Button4_Click(object sender, EventArgs e)
	{
		config_avan = 1;
		MyProject.Forms.Config_avanzada.Show();
	}

	private void Button6_Click(object sender, EventArgs e)
	{
		config_avan = 2;
		MyProject.Forms.Config_avanzada.Show();
	}

	private void Button8_Click(object sender, EventArgs e)
	{
		actualizar_Fecha();
	}

	private void actualizar_Fecha()
	{
		chiva = 3;
		dia = Conversions.ToString(MyProject.Computer.Clock.LocalTime.Day);
		mes = Conversions.ToString(MyProject.Computer.Clock.LocalTime.Month);
		ano = Strings.Mid(Conversions.ToString(MyProject.Computer.Clock.LocalTime.Year), 3, 2);
		horas = Conversions.ToString(MyProject.Computer.Clock.LocalTime.Hour);
		minu = Conversions.ToString(MyProject.Computer.Clock.LocalTime.Minute);
		segu = Conversions.ToString(MyProject.Computer.Clock.LocalTime.Second);
		if (mes.Length == 1)
		{
			mes = "0" + mes;
		}
		if (dia.Length == 1)
		{
			dia = "0" + dia;
		}
		string value = Conversions.ToString((int)MyProject.Computer.Clock.LocalTime.DayOfWeek);
		if (Conversions.ToInteger(value) == 0)
		{
			dia_semana = 7;
		}
		else
		{
			dia_semana = Conversions.ToInteger(value);
		}
		if (horas.Length == 1)
		{
			horas = "0" + horas;
		}
		if (minu.Length == 1)
		{
			minu = "0" + minu;
		}
		if (segu.Length == 1)
		{
			segu = "0" + segu;
		}
		dia_semana = 1;
		BufferOut[0] = 0;
		BufferOut[1] = 72;
		checked
		{
			BufferOut[2] = (byte)Math.Round(Conversion.Val(dia));
			BufferOut[3] = (byte)Math.Round(Conversion.Val(mes));
			BufferOut[4] = (byte)Math.Round(Conversion.Val(ano));
			BufferOut[5] = (byte)Math.Round(Conversion.Val(horas));
			BufferOut[6] = (byte)Math.Round(Conversion.Val(minu));
			BufferOut[7] = (byte)Math.Round(Conversion.Val(segu));
			BufferOut[8] = (byte)Math.Round(Conversion.Val(dia_semana));
			ref string reference = ref log2;
			reference = reference + frases.ResourceManager.GetString("fechadeclockenviada") + dia + "-" + mes + "-" + ano + " - " + horas + ":" + minu + ":" + segu + NL;
			int num = 9;
			do
			{
				BufferOut[num] = 90;
				num++;
			}
			while (num <= 64);
			mcHIDInterface.hidWriteEx(957, 13, ref BufferOut[0]);
		}
	}

	private void Form2_FormClosing(object sender, FormClosingEventArgs e)
	{
		Validate();
		RGBindingSource2.EndEdit();
		RGTableAdapter.Update(VehiculosDataSet.RG);
		MyProject.Forms.Principal.Visible = true;
	}

	private void Form2_FormClosed(object sender, FormClosedEventArgs e)
	{
		mcHIDInterface.DisconnectFromHID();
	}

	private void Button5_Click(object sender, EventArgs e)
	{
		Close();
	}

	private void Button1_Click(object sender, EventArgs e)
	{
		if (conex == 0)
		{
			try
			{
				Form targetForm = this;
				mcHIDInterface.ConnectToHID(ref targetForm);
				ref string reference = ref log2;
				reference = reference + frases.ResourceManager.GetString("USB") + NL;
			}
			catch (Exception ex)
			{
				ProjectData.SetProjectError(ex);
				Exception ex2 = ex;
				Interaction.MsgBox("Ha ocurrido un problema. Verifique que el Dispositivo está conectado al puerto USB.", MsgBoxStyle.OkOnly, "Error");
				ref string reference2 = ref log2;
				reference2 = reference2 + "Ha ocurrido un problema. Verifique que el Dispositivo está conectado al puerto USB." + NL;
				ProjectData.ClearProjectError();
			}
		}
	}

	private void Button3_Click(object sender, EventArgs e)
	{
		if (conex == 1)
		{
			mcHIDInterface.DisconnectFromHID();
			Interaction.MsgBox("Dispositivo Desconectado", MsgBoxStyle.OkOnly, "INCLISAFE");
			conex = 0;
			Button2.Enabled = false;
			Button3.Enabled = false;
			Button7.Enabled = false;
			Button1.Enabled = true;
			Label4.ForeColor = Color.Red;
			Label4.Text = frases.ResourceManager.GetString("noconectado");
			ProgressBar1.Value = 0;
		}
	}

	[DllImport("kernel32.dll", CharSet = CharSet.Ansi, ExactSpelling = true, SetLastError = true)]
	private static extern void Sleep(long dwMilliseconds);

	public void OnPlugged(int pHandle)
	{
		if ((mcHIDInterface.hidGetVendorID(pHandle) == 957) & (mcHIDInterface.hidGetProductID(pHandle) == 13))
		{
			Interaction.MsgBox("Dispositivo Conectado", MsgBoxStyle.OkOnly, "INCLISAFE");
			comprobar_calendario();
			conex = 1;
			if (conex == 1)
			{
				Button2.Enabled = true;
				Button3.Enabled = true;
				Button7.Enabled = true;
				Button1.Enabled = false;
				Label4.ForeColor = Color.Green;
				Label4.Text = frases.ResourceManager.GetString("conectado");
				ref string reference = ref log2;
				reference = reference + "Dispositivo Conectado al puerto USB." + NL;
			}
			else
			{
				Button1.Enabled = true;
			}
		}
	}

	public void OnUnplugged(int pHandle)
	{
		if ((mcHIDInterface.hidGetVendorID(pHandle) == 957) & (mcHIDInterface.hidGetProductID(pHandle) == 13))
		{
			mcHIDInterface.hidSetReadNotify(mcHIDInterface.hidGetHandle(957, 13), pValue: false);
			Interaction.MsgBox("Dispositivo Desconectado", MsgBoxStyle.OkOnly, "INCLISAFE");
		}
	}

	public void OnChanged()
	{
		mcHIDInterface.hidGetHandle(957, 13);
		mcHIDInterface.hidSetReadNotify(mcHIDInterface.hidGetHandle(957, 13), pValue: true);
	}

	public void OnRead(int pHandle)
	{
		checked
		{
			if (mcHIDInterface.hidRead(pHandle, ref BufferIn[0]))
			{
				int num = 1;
				do
				{
					datoen[num] = BufferIn[num];
					num++;
				}
				while (num <= 64);
			}
			if (chiva == 1)
			{
				if (datoen[1] == 187)
				{
					ref string reference = ref log2;
					reference = reference + frases.ResourceManager.GetString("intervalosdealarmacargados") + NL;
					ref string reference2 = ref log2;
					reference2 = reference2 + frases.ResourceManager.GetString("configuracion1") + NL;
					ref string reference3 = ref log2;
					reference3 = reference3 + "T1: " + Conversions.ToString(T1_1) + NL;
					ref string reference4 = ref log2;
					reference4 = reference4 + "T2: " + Conversions.ToString(T2_1) + NL;
					ref string reference5 = ref log2;
					reference5 = reference5 + "T3: " + Conversions.ToString(T3_1) + NL;
					ref string reference6 = ref log2;
					reference6 = reference6 + "T4: " + Conversions.ToString(T4_1) + NL;
					ref string reference7 = ref log2;
					reference7 = reference7 + "Ka: " + Conversions.ToString(KA_1) + NL;
					ref string reference8 = ref log2;
					reference8 = reference8 + "Kg: " + Conversions.ToString(KG_1) + NL;
					ref string reference9 = ref log2;
					reference9 = reference9 + frases.ResourceManager.GetString("configuracion2") + NL;
					ref string reference10 = ref log2;
					reference10 = reference10 + "T1: " + Conversions.ToString(T1_2) + NL;
					ref string reference11 = ref log2;
					reference11 = reference11 + "T2: " + Conversions.ToString(T2_2) + NL;
					ref string reference12 = ref log2;
					reference12 = reference12 + "T3: " + Conversions.ToString(T3_2) + NL;
					ref string reference13 = ref log2;
					reference13 = reference13 + "T4: " + Conversions.ToString(T4_2) + NL;
					ref string reference14 = ref log2;
					reference14 = reference14 + "Ka: " + Conversions.ToString(KA_2) + NL;
					ref string reference15 = ref log2;
					reference15 = reference15 + "Kg: " + Conversions.ToString(KG_2) + NL;
					ProgressBar1.Value = 90;
					ref string reference16 = ref log2;
					reference16 = reference16 + frases.ResourceManager.GetString("datoscargados") + NL;
					Timer1.Start();
				}
				else if (datoen[1] == 70)
				{
					Label2.Text = "ERROR DE COMUNICACIÓN";
					Label2.Visible = true;
					Interaction.MsgBox("Ha ocurrido un error de comunicación con el" + NL + "Dispositivo. Por favor, verifique la conexión y" + NL + "repita el proceso de carga de datos.", MsgBoxStyle.OkOnly, "Error de comunicación");
				}
				else
				{
					Label2.Text = "ERROR DE COMUNICACIÓN";
					Label2.Visible = true;
					Interaction.MsgBox("Ha ocurrido un error de comunicación con el" + NL + "Dispositivo. Por favor, verifique la conexión y" + NL + "repita el proceso de carga de datos.", MsgBoxStyle.OkOnly, "Error de comunicación");
				}
			}
			else if (chiva == 2)
			{
				Estado_Datos_Cargados = "";
				Estado_Datos_Cargados += frases.ResourceManager.GetString("bastidordelvehiculo");
				int num2 = 3;
				do
				{
					if (datoen[num2] != 42)
					{
						Estado_Datos_Cargados += Conversions.ToString(Strings.Chr(datoen[num2]));
					}
					num2++;
				}
				while (num2 <= 22);
				Estado_Datos_Cargados += NL;
				chiva = 22;
			}
			else if (chiva == 22)
			{
				ref string estado_Datos_Cargados = ref Estado_Datos_Cargados;
				estado_Datos_Cargados = estado_Datos_Cargados + "Posición del selector en Configuración 1:" + NL;
				ref string estado_Datos_Cargados2 = ref Estado_Datos_Cargados;
				ref string reference17 = ref estado_Datos_Cargados2;
				estado_Datos_Cargados2 = reference17 + "     C = ALFA = 90-FIc = " + Conversions.ToString(Strings.Chr(datoen[7])) + Conversions.ToString(Strings.Chr(datoen[8])) + Conversions.ToString(Strings.Chr(datoen[9])) + Conversions.ToString(Strings.Chr(datoen[10])) + Conversions.ToString(Strings.Chr(datoen[11])) + NL;
				ref string estado_Datos_Cargados3 = ref Estado_Datos_Cargados;
				reference17 = ref estado_Datos_Cargados3;
				estado_Datos_Cargados3 = reference17 + "     B = D1 = " + Conversions.ToString(Strings.Chr(datoen[2])) + Conversions.ToString(Strings.Chr(datoen[3])) + Conversions.ToString(Strings.Chr(datoen[4])) + Conversions.ToString(Strings.Chr(datoen[5])) + Conversions.ToString(Strings.Chr(datoen[6])) + NL;
				ref string estado_Datos_Cargados4 = ref Estado_Datos_Cargados;
				reference17 = ref estado_Datos_Cargados4;
				estado_Datos_Cargados4 = reference17 + "     D = CoefIxx = " + Conversions.ToString(Strings.Chr(datoen[12])) + Conversions.ToString(Strings.Chr(datoen[13])) + Conversions.ToString(Strings.Chr(datoen[14])) + Conversions.ToString(Strings.Chr(datoen[15])) + Conversions.ToString(Strings.Chr(datoen[16])) + NL;
				ref string estado_Datos_Cargados5 = ref Estado_Datos_Cargados;
				reference17 = ref estado_Datos_Cargados5;
				estado_Datos_Cargados5 = reference17 + "     Intervalos Alarma: " + Conversions.ToString(datoen[32]) + " - " + Conversions.ToString(datoen[33]) + " - " + Conversions.ToString(datoen[34]) + " - " + Conversions.ToString(datoen[35]) + NL;
				ref string estado_Datos_Cargados6 = ref Estado_Datos_Cargados;
				reference17 = ref estado_Datos_Cargados6;
				estado_Datos_Cargados6 = reference17 + "     Valores Filtro Sensores: Acelerómetro: " + Conversions.ToString(datoen[51]) + "." + Conversions.ToString(datoen[52]) + " - Giróscopo: " + Conversions.ToString(datoen[55]) + "." + Conversions.ToString(datoen[56]) + NL;
				ref string estado_Datos_Cargados7 = ref Estado_Datos_Cargados;
				estado_Datos_Cargados7 = estado_Datos_Cargados7 + "Posición del selector en Configuración 2:" + NL;
				ref string estado_Datos_Cargados8 = ref Estado_Datos_Cargados;
				reference17 = ref estado_Datos_Cargados8;
				estado_Datos_Cargados8 = reference17 + "     C = ALFA = 90-FIc = " + Conversions.ToString(Strings.Chr(datoen[22])) + Conversions.ToString(Strings.Chr(datoen[23])) + Conversions.ToString(Strings.Chr(datoen[24])) + Conversions.ToString(Strings.Chr(datoen[25])) + Conversions.ToString(Strings.Chr(datoen[26])) + NL;
				ref string estado_Datos_Cargados9 = ref Estado_Datos_Cargados;
				reference17 = ref estado_Datos_Cargados9;
				estado_Datos_Cargados9 = reference17 + "     B = D1 = " + Conversions.ToString(Strings.Chr(datoen[17])) + Conversions.ToString(Strings.Chr(datoen[18])) + Conversions.ToString(Strings.Chr(datoen[19])) + Conversions.ToString(Strings.Chr(datoen[20])) + Conversions.ToString(Strings.Chr(datoen[21])) + NL;
				ref string estado_Datos_Cargados10 = ref Estado_Datos_Cargados;
				reference17 = ref estado_Datos_Cargados10;
				estado_Datos_Cargados10 = reference17 + "     D = CoefIxx = " + Conversions.ToString(Strings.Chr(datoen[27])) + Conversions.ToString(Strings.Chr(datoen[28])) + Conversions.ToString(Strings.Chr(datoen[29])) + Conversions.ToString(Strings.Chr(datoen[30])) + Conversions.ToString(Strings.Chr(datoen[31])) + NL;
				ref string estado_Datos_Cargados11 = ref Estado_Datos_Cargados;
				reference17 = ref estado_Datos_Cargados11;
				estado_Datos_Cargados11 = reference17 + "     Intervalos Alarma: " + Conversions.ToString(datoen[36]) + " - " + Conversions.ToString(datoen[37]) + " - " + Conversions.ToString(datoen[38]) + " - " + Conversions.ToString(datoen[39]) + NL;
				ref string estado_Datos_Cargados12 = ref Estado_Datos_Cargados;
				reference17 = ref estado_Datos_Cargados12;
				estado_Datos_Cargados12 = reference17 + "     Valores Filtro Sensores: Acelerómetro: " + Conversions.ToString(datoen[53]) + "." + Conversions.ToString(datoen[54]) + " - Giróscopo: " + Conversions.ToString(datoen[57]) + "." + Conversions.ToString(datoen[58]) + NL;
				MyProject.Forms.estado_disp.Show();
				Timer3.Start();
			}
			else if (chiva == 3)
			{
				if (datoen[1] == 204)
				{
					ref string reference18 = ref log2;
					reference18 = reference18 + frases.ResourceManager.GetString("clockactualizadocorrectamente") + NL;
					ref string reference19 = ref log2;
					reference19 = reference19 + frases.ResourceManager.GetString("fechacargada") + fecha_cargada + NL;
					ref string reference20 = ref log2;
					reference20 = reference20 + frases.ResourceManager.GetString("horacargada") + hora_cargada + NL;
					if (ocultamsg == 0)
					{
						MessageBox.Show("Calendario actualizado OK.");
					}
				}
				else
				{
					Label2.Text = "ERROR DE COMUNICACIÓN";
					Label2.Visible = true;
					Interaction.MsgBox("Ha ocurrido un error de comunicación con el" + NL + "Dispositivo. Por favor, verifique la conexión y" + NL + "repita el proceso de carga de datos.", MsgBoxStyle.OkOnly, "Error de comunicación");
				}
			}
			else if (chiva == 8)
			{
				string text = datoen[2].ToString().PadLeft(2, '0') + "-" + datoen[3].ToString().PadLeft(2, '0') + "-" + datoen[4].ToString().PadLeft(2, '0');
				string text2 = datoen[5].ToString().PadLeft(2, '0') + ":" + datoen[6].ToString().PadLeft(2, '0') + ":" + datoen[7].ToString().PadLeft(2, '0');
				Conversions.ToString(datoen[8]);
				ref string estado_Datos_Cargados13 = ref Estado_Datos_Cargados;
				estado_Datos_Cargados13 = estado_Datos_Cargados13 + "     Fecha del Reloj interno: " + text + NL;
				ref string estado_Datos_Cargados14 = ref Estado_Datos_Cargados;
				estado_Datos_Cargados14 = estado_Datos_Cargados14 + "     Hora del Reloj interno: " + text2 + NL;
				TextBox7.Text = text + " " + text2;
			}
		}
	}

	private void comprobar_calendario()
	{
		chiva = 8;
		BufferOut[0] = 0;
		BufferOut[1] = 73;
		int num = 2;
		do
		{
			BufferOut[num] = 90;
			num = checked(num + 1);
		}
		while (num <= 64);
		mcHIDInterface.hidWriteEx(957, 13, ref BufferOut[0]);
	}

	private void Button2_Click(object sender, EventArgs e)
	{
		bool flag = false;
		if (Operators.CompareString(TextBox1.Text, "", TextCompare: false) == 0)
		{
			Interaction.MsgBox("Debe introducir un número de identificación de Dispositivo.", MsgBoxStyle.OkOnly, "Advertencia");
			ref string reference = ref log2;
			reference = reference + "Advertencia: Debe introducir un número de identificación de Dispositivo." + NL;
			return;
		}
		Vehiculo = VehiculosDataSet.RG[RGBindingSource2.Position].Matricula;
		ref string reference2 = ref log2;
		reference2 = reference2 + frases.ResourceManager.GetString("iniciodecargadedatos") + NL;
		ref string reference3 = ref log2;
		reference3 = reference3 + frases.ResourceManager.GetString("bastidordelvehiculo") + TextBox3.Text + NL;
		ref string reference4 = ref log2;
		reference4 = reference4 + frases.ResourceManager.GetString("numerodeldispositivo") + TextBox1.Text + NL;
		ref string reference5 = ref log2;
		reference5 = reference5 + frases.ResourceManager.GetString("procesodecarga") + NL;
		T1_1 = Conversions.ToInteger(VehiculosDataSet.RG[RGBindingSource2.Position].T11);
		T2_1 = Conversions.ToInteger(VehiculosDataSet.RG[RGBindingSource2.Position].T21);
		T3_1 = Conversions.ToInteger(VehiculosDataSet.RG[RGBindingSource2.Position].T31);
		T4_1 = Conversions.ToInteger(VehiculosDataSet.RG[RGBindingSource2.Position].T41);
		T1_2 = Conversions.ToInteger(VehiculosDataSet.RG[RGBindingSource2.Position].T12);
		T2_2 = Conversions.ToInteger(VehiculosDataSet.RG[RGBindingSource2.Position].T22);
		T3_2 = Conversions.ToInteger(VehiculosDataSet.RG[RGBindingSource2.Position].T32);
		T4_2 = Conversions.ToInteger(VehiculosDataSet.RG[RGBindingSource2.Position].T42);
		KA_1 = Conversions.ToSingle(VehiculosDataSet.RG[RGBindingSource2.Position].KA1);
		KG_1 = Conversions.ToSingle(VehiculosDataSet.RG[RGBindingSource2.Position].KG1);
		KA_2 = Conversions.ToSingle(VehiculosDataSet.RG[RGBindingSource2.Position].KA2);
		KG_2 = Conversions.ToSingle(VehiculosDataSet.RG[RGBindingSource2.Position].KG2);
		try
		{
			ProgressBar1.Value = 20;
			cargarconfig1();
			ProgressBar1.Value = 30;
			cargarconfig2();
			ProgressBar1.Value = 40;
		}
		catch (Exception projectError)
		{
			ProjectData.SetProjectError(projectError);
			flag = true;
			ProjectData.ClearProjectError();
		}
		if (!flag)
		{
			ocultamsg = 1;
			GroupBox6.BackColor = Color.Gray;
			GroupBox7.BackColor = Color.Gray;
			actualizar_Fecha();
			Timer2.Start();
		}
		else
		{
			GroupBox6.BackColor = Color.Red;
			GroupBox7.BackColor = Color.Red;
			ref string reference6 = ref log2;
			reference6 = reference6 + "Error en los parámetros, no se cargará ningún dato" + NL;
		}
	}

	private void cargarconfig1()
	{
		ref string reference = ref log2;
		reference = reference + frases.ResourceManager.GetString("configuracion1") + NL;
		TextBox_D1.Text = Strings.Replace(TextBox_D1.Text, ",", ".");
		TextBox_Alfa1.Text = Strings.Replace(TextBox_Alfa1.Text, ",", ".");
		TextBox_Coeff1.Text = Strings.Replace(TextBox_Coeff1.Text, ",", ".");
		float num = float.Parse(TextBox_D1.Text, CultureInfo.InvariantCulture);
		float num2 = float.Parse(TextBox_Alfa1.Text, CultureInfo.InvariantCulture);
		float num3 = float.Parse(TextBox_Coeff1.Text, CultureInfo.InvariantCulture);
		double num4 = 90f - num2;
		double num5 = num;
		double num6 = num2;
		double num7 = num3;
		num4 = Math.Round(100.0 * num4) / 100.0;
		num5 = Math.Round(1000.0 * num5) / 1000.0;
		num6 = Math.Round(100.0 * num6) / 100.0;
		num7 = Math.Round(1000.0 * num7) / 1000.0;
		ref string reference2 = ref log2;
		reference2 = reference2 + "Datos cargados: " + NL;
		ref string reference3 = ref log2;
		reference3 = reference3 + "A1: FIc = " + Conversions.ToString(num4) + NL;
		ref string reference4 = ref log2;
		reference4 = reference4 + "B1: D1 = " + Conversions.ToString(num5) + NL;
		ref string reference5 = ref log2;
		reference5 = reference5 + "C1: alfa = " + Conversions.ToString(num6) + NL;
		ref string reference6 = ref log2;
		reference6 = reference6 + "D1: CoeffIxx = " + Conversions.ToString(num7) + NL;
		ref string reference7 = ref log2;
		reference7 = reference7 + "KA: " + Conversions.ToString(KA_1) + NL;
		ref string reference8 = ref log2;
		reference8 = reference8 + "KG: " + Conversions.ToString(KG_1) + NL;
		string text = Conversions.ToString(num4);
		int num8 = 0;
		checked
		{
			do
			{
				if (Operators.CompareString(Conversions.ToString(text[num8]), ",", TextCompare: false) == 0)
				{
					A_1[num8] = ".";
				}
				else
				{
					A_1[num8] = Conversions.ToString(text[num8]);
				}
				num8++;
			}
			while (num8 <= 4);
			text = Conversions.ToString(num5);
			int num9 = 0;
			do
			{
				if (Operators.CompareString(Conversions.ToString(text[num9]), ",", TextCompare: false) == 0)
				{
					B_1[num9] = ".";
				}
				else
				{
					B_1[num9] = Conversions.ToString(text[num9]);
				}
				num9++;
			}
			while (num9 <= 4);
			text = Conversions.ToString(num6);
			int num10 = 0;
			do
			{
				if (Operators.CompareString(Conversions.ToString(text[num10]), ",", TextCompare: false) == 0)
				{
					C_1[num10] = ".";
				}
				else
				{
					C_1[num10] = Conversions.ToString(text[num10]);
				}
				num10++;
			}
			while (num10 <= 4);
			text = Conversions.ToString(num7);
			int num11 = 0;
			do
			{
				if (Operators.CompareString(Conversions.ToString(text[num11]), ",", TextCompare: false) == 0)
				{
					D_1[num11] = ".";
				}
				else
				{
					D_1[num11] = Conversions.ToString(text[num11]);
				}
				num11++;
			}
			while (num11 <= 4);
			text = Conversions.ToString(KA_1);
			if (text.Length == 1)
			{
				text += ",00";
			}
			else if (text.Length == 3)
			{
				text += "0";
			}
			int num12 = 0;
			do
			{
				if (Operators.CompareString(Conversions.ToString(text[num12]), ",", TextCompare: false) == 0)
				{
					KA1[num12] = ".";
				}
				else
				{
					KA1[num12] = Conversions.ToString(text[num12]);
				}
				num12++;
			}
			while (num12 <= 3);
			text = Conversions.ToString(KG_1);
			if (text.Length == 1)
			{
				text += ",00";
			}
			else if (text.Length == 3)
			{
				text += "0";
			}
			int num13 = 0;
			do
			{
				if (Operators.CompareString(Conversions.ToString(text[num13]), ",", TextCompare: false) == 0)
				{
					KG1[num13] = ".";
				}
				else
				{
					KG1[num13] = Conversions.ToString(text[num13]);
				}
				num13++;
			}
			while (num13 <= 3);
		}
	}

	private void cargarconfig2()
	{
		ref string reference = ref log2;
		reference = reference + frases.ResourceManager.GetString("configuracion2") + NL;
		TextBox_D2.Text = Strings.Replace(TextBox_D2.Text, ",", ".");
		TextBox_Alfa2.Text = Strings.Replace(TextBox_Alfa2.Text, ",", ".");
		TextBox_Coeff2.Text = Strings.Replace(TextBox_Coeff2.Text, ",", ".");
		float num = float.Parse(TextBox_D2.Text, CultureInfo.InvariantCulture);
		float num2 = float.Parse(TextBox_Alfa2.Text, CultureInfo.InvariantCulture);
		float num3 = float.Parse(TextBox_Coeff2.Text, CultureInfo.InvariantCulture);
		double num4 = 90f - num2;
		double num5 = num;
		double num6 = num2;
		double num7 = num3;
		num4 = Math.Round(100.0 * num4) / 100.0;
		num5 = Math.Round(1000.0 * num5) / 1000.0;
		num6 = Math.Round(100.0 * num6) / 100.0;
		num7 = Math.Round(1000.0 * num7) / 1000.0;
		ref string reference2 = ref log2;
		reference2 = reference2 + "Datos cargados: " + NL;
		ref string reference3 = ref log2;
		reference3 = reference3 + "A2: FIc = " + Conversions.ToString(num4) + NL;
		ref string reference4 = ref log2;
		reference4 = reference4 + "B2: D1 = " + Conversions.ToString(num5) + NL;
		ref string reference5 = ref log2;
		reference5 = reference5 + "C2: alfa = " + Conversions.ToString(num6) + NL;
		ref string reference6 = ref log2;
		reference6 = reference6 + "D2: CoeffIxx = " + Conversions.ToString(num7) + NL;
		ref string reference7 = ref log2;
		reference7 = reference7 + "KA: " + Conversions.ToString(KA_2) + NL;
		ref string reference8 = ref log2;
		reference8 = reference8 + "KG: " + Conversions.ToString(KG_2) + NL;
		string text = Conversions.ToString(num4);
		int num8 = 0;
		checked
		{
			do
			{
				if (Operators.CompareString(Conversions.ToString(text[num8]), ",", TextCompare: false) == 0)
				{
					A_2[num8] = ".";
				}
				else
				{
					A_2[num8] = Conversions.ToString(text[num8]);
				}
				num8++;
			}
			while (num8 <= 4);
			text = Conversions.ToString(num5);
			int num9 = 0;
			do
			{
				if (Operators.CompareString(Conversions.ToString(text[num9]), ",", TextCompare: false) == 0)
				{
					B_2[num9] = ".";
				}
				else
				{
					B_2[num9] = Conversions.ToString(text[num9]);
				}
				num9++;
			}
			while (num9 <= 4);
			text = Conversions.ToString(num6);
			int num10 = 0;
			do
			{
				if (Operators.CompareString(Conversions.ToString(text[num10]), ",", TextCompare: false) == 0)
				{
					C_2[num10] = ".";
				}
				else
				{
					C_2[num10] = Conversions.ToString(text[num10]);
				}
				num10++;
			}
			while (num10 <= 4);
			text = Conversions.ToString(num7);
			int num11 = 0;
			do
			{
				if (Operators.CompareString(Conversions.ToString(text[num11]), ",", TextCompare: false) == 0)
				{
					D_2[num11] = ".";
				}
				else
				{
					D_2[num11] = Conversions.ToString(text[num11]);
				}
				num11++;
			}
			while (num11 <= 4);
			text = Conversions.ToString(KA_2);
			if (text.Length == 1)
			{
				text += ",00";
			}
			else if (text.Length == 3)
			{
				text += "0";
			}
			int num12 = 0;
			do
			{
				if (Operators.CompareString(Conversions.ToString(text[num12]), ",", TextCompare: false) == 0)
				{
					KA2[num12] = ".";
				}
				else
				{
					KA2[num12] = Conversions.ToString(text[num12]);
				}
				num12++;
			}
			while (num12 <= 3);
			text = Conversions.ToString(KG_2);
			if (text.Length == 1)
			{
				text += ",00";
			}
			else if (text.Length == 3)
			{
				text += "0";
			}
			int num13 = 0;
			do
			{
				if (Operators.CompareString(Conversions.ToString(text[num13]), ",", TextCompare: false) == 0)
				{
					KG2[num13] = ".";
				}
				else
				{
					KG2[num13] = Conversions.ToString(text[num13]);
				}
				num13++;
			}
			while (num13 <= 3);
		}
	}

	private void Button10_Click(object sender, EventArgs e)
	{
		MyProject.Forms.log_window.Show();
	}

	private void Button7_Click(object sender, EventArgs e)
	{
		chiva = 2;
		BufferOut[0] = 0;
		BufferOut[1] = 74;
		int num = 2;
		do
		{
			BufferOut[num] = 90;
			num = checked(num + 1);
		}
		while (num <= 64);
		mcHIDInterface.hidWriteEx(957, 13, ref BufferOut[0]);
	}

	private void ComboBox1_SelectedIndexChanged(object sender, EventArgs e)
	{
		actualizar_lista();
	}

	private void ListBox1_SelectedIndexChanged(object sender, EventArgs e)
	{
		string key = Conversions.ToString(ListBox1.SelectedItem);
		RGBindingSource2.Position = RGBindingSource2.Find("Matricula", key);
	}

	private void Timer3_Tick(object sender, EventArgs e)
	{
		Timer3.Stop();
	}

	private void Timer1_Tick(object sender, EventArgs e)
	{
		Grabar_Carga();
		Timer1.Stop();
	}

	private void Grabar_Carga()
	{
		DatosDataSet.FechasDataTable fechas = DatosDataSet.Fechas;
		DataRowCollection rows = fechas.Rows;
		DataRow dataRow = fechas.NewRow();
		FechasBindingSource.Position = checked(FechasBindingSource.Count - 1);
		if (FechasBindingSource.Count == 0)
		{
			dataRow[0] = 1;
		}
		else
		{
			dataRow[0] = Conversions.ToDouble(DatosDataSet.Fechas[FechasBindingSource.Position].Id) + 1.0;
		}
		string id = Id;
		string text = Id_Disp[0] + Id_Disp[1] + Id_Disp[2] + Id_Disp[3] + Id_Disp[4];
		dataRow[1] = fecha_cargada;
		dataRow[2] = hora_cargada;
		dataRow[3] = id;
		dataRow[4] = text;
		dataRow[5] = "";
		dataRow[6] = "";
		VehiculosDataSet.RG[RGBindingSource2.Position].Id_Dispositivo = text;
		VehiculosDataSet.RG[RGBindingSource2.Position].Fecha_Carga = Conversions.ToString(dataRow[1]);
		VehiculosDataSet.RG[RGBindingSource2.Position].Datos_Cargados = "Datos cargados";
		ref string reference = ref log2;
		reference = reference + "Datos cargados y guardados correctamente." + NL + NL;
		string text2 = MyProject.Forms.Principal.ruta_raiz + "\\INCLISAFE\\" + id + "\\Cargas de Datos";
		if (!MyProject.Computer.FileSystem.DirectoryExists(text2))
		{
			Directory.CreateDirectory(text2);
		}
		string text3 = "Log_Carga_dispositivo_" + text + "_" + fecha_cargada;
		string text4 = text2 + "\\" + text3 + ".txt";
		using (StreamWriter streamWriter = new StreamWriter(text4))
		{
			streamWriter.WriteLine(log2);
			streamWriter.Close();
		}
		dataRow[7] = text4;
		dataRow[8] = TextBox_D1.Text;
		dataRow[9] = TextBox_Alfa1.Text;
		dataRow[10] = TextBox_Coeff1.Text;
		dataRow[11] = TextBox_D2.Text;
		dataRow[12] = TextBox_Alfa2.Text;
		dataRow[13] = TextBox_Coeff2.Text;
		rows.Add(dataRow);
		RGBindingSource2.EndEdit();
		RGTableAdapter.Update(VehiculosDataSet.RG);
		FechasBindingSource.EndEdit();
		FechasTableAdapter.Update(DatosDataSet.Fechas);
		ProgressBar1.Value = 100;
		Label2.Text = "DATOS CARGADOS CORECTAMENTE";
		Label2.Visible = true;
	}

	private void Timer2_Tick(object sender, EventArgs e)
	{
		ocultamsg = 0;
		fecha_cargada = Conversions.ToString(datoen[2]) + "-" + Conversions.ToString(datoen[3]) + "-" + Conversions.ToString(datoen[4]);
		hora_cargada = Conversions.ToString(datoen[5]) + ":" + Conversions.ToString(datoen[6]) + ":" + Conversions.ToString(datoen[7]);
		dia_semana_cargado = Conversions.ToString(datoen[8]);
		ProgressBar1.Value = 60;
		cargardatos();
		Timer2.Stop();
	}

	private void cargardatos()
	{
		Id = Vehiculo;
		string text = TextBox1.Text;
		if (text.Length == 1)
		{
			text = "000" + text;
		}
		else if (text.Length == 2)
		{
			text = "00" + text;
		}
		else if (text.Length == 3)
		{
			text = "0" + text;
		}
		int num = 0;
		checked
		{
			do
			{
				Id_Disp[num] = Conversions.ToString(text[num]);
				num++;
			}
			while (num <= 4);
			ref string reference = ref log2;
			reference = reference + "INICIO DE CARGA DE DATOS: " + NL;
			BufferOut[0] = 0;
			BufferOut[1] = 97;
			BufferOut[2] = 98;
			byte[] bytes = Encoding.ASCII.GetBytes(Id.PadRight(20, '*'));
			int num2 = 1;
			do
			{
				BufferOut[num2 + 2] = bytes[num2 - 1];
				num2++;
			}
			while (num2 <= 20);
			int num3 = 23;
			do
			{
				BufferOut[num3] = 122;
				num3++;
			}
			while (num3 <= 64);
			mcHIDInterface.hidWriteEx(957, 13, ref BufferOut[0]);
			Thread.Sleep(200);
			BufferOut[0] = 0;
			BufferOut[1] = 75;
			int num4 = 1;
			do
			{
				BufferOut[num4 + 1] = (byte)Strings.Asc(B_1[num4 - 1]);
				num4++;
			}
			while (num4 <= 5);
			int num5 = 1;
			do
			{
				BufferOut[num5 + 6] = (byte)Strings.Asc(C_1[num5 - 1]);
				num5++;
			}
			while (num5 <= 5);
			int num6 = 1;
			do
			{
				BufferOut[num6 + 11] = (byte)Strings.Asc(D_1[num6 - 1]);
				num6++;
			}
			while (num6 <= 5);
			ref string reference2 = ref log2;
			reference2 = reference2 + "Configuración 1 cargada correctamente" + NL;
			ProgressBar1.Value = 60;
			int num7 = 1;
			do
			{
				BufferOut[num7 + 16] = (byte)Strings.Asc(B_2[num7 - 1]);
				num7++;
			}
			while (num7 <= 5);
			int num8 = 1;
			do
			{
				BufferOut[num8 + 21] = (byte)Strings.Asc(C_2[num8 - 1]);
				num8++;
			}
			while (num8 <= 5);
			int num9 = 1;
			do
			{
				BufferOut[num9 + 26] = (byte)Strings.Asc(D_2[num9 - 1]);
				num9++;
			}
			while (num9 <= 5);
			ref string reference3 = ref log2;
			reference3 = reference3 + "Configuración 2 cargada correctamente" + NL;
			ProgressBar1.Value = 70;
			BufferOut[32] = (byte)T1_1;
			BufferOut[33] = (byte)T2_1;
			BufferOut[34] = (byte)T3_1;
			BufferOut[35] = (byte)T4_1;
			BufferOut[36] = (byte)T1_2;
			BufferOut[37] = (byte)T2_2;
			BufferOut[38] = (byte)T3_2;
			BufferOut[39] = (byte)T4_2;
			int num10 = 1;
			do
			{
				BufferOut[num10 + 39] = 0;
				num10++;
			}
			while (num10 <= 6);
			BufferOut[46] = (byte)Strings.Asc(Id_Disp[0]);
			BufferOut[47] = (byte)Strings.Asc(Id_Disp[1]);
			BufferOut[48] = (byte)Strings.Asc(Id_Disp[2]);
			BufferOut[49] = (byte)Strings.Asc(Id_Disp[3]);
			BufferOut[50] = (byte)Strings.Asc(Id_Disp[4]);
			BufferOut[51] = (byte)Math.Round(Conversion.Val(KA1[0]));
			BufferOut[52] = (byte)Math.Round(Conversion.Val(KA1[2] + KA1[3]));
			BufferOut[53] = (byte)Math.Round(Conversion.Val(KA2[0]));
			BufferOut[54] = (byte)Math.Round(Conversion.Val(KA2[2] + KA2[3]));
			BufferOut[55] = (byte)Math.Round(Conversion.Val(KG1[0]));
			BufferOut[56] = (byte)Math.Round(Conversion.Val(KG1[2] + KG1[3]));
			BufferOut[57] = (byte)Math.Round(Conversion.Val(KG2[0]));
			BufferOut[58] = (byte)Math.Round(Conversion.Val(KG2[2] + KG2[3]));
			int num11 = 59;
			do
			{
				BufferOut[num11] = 88;
				num11++;
			}
			while (num11 <= 64);
			chiva = 1;
			mcHIDInterface.hidWriteEx(957, 13, ref BufferOut[0]);
			ref string reference4 = ref log2;
			reference4 = reference4 + "Datos enviados correctamente." + NL;
			ProgressBar1.Value = 90;
		}
	}

	private void Label4_Click(object sender, EventArgs e)
	{
	}

	private void Label14_Click(object sender, EventArgs e)
	{
	}
}
