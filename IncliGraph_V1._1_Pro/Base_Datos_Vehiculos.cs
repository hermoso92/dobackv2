using System;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Resources;
using System.Runtime.CompilerServices;
using System.Windows.Forms;
using IncliGraph_V1._1_Pro.DatosDataSetTableAdapters;
using IncliGraph_V1._1_Pro.My;
using IncliGraph_V1._1_Pro.VehiculosDataSetTableAdapters;
using Microsoft.VisualBasic;
using Microsoft.VisualBasic.CompilerServices;
using Microsoft.VisualBasic.FileIO;

namespace IncliGraph_V1._1_Pro;

[DesignerGenerated]
public class Base_Datos_Vehiculos : Form
{
	private IContainer components;

	[CompilerGenerated]
	[AccessedThroughProperty("Button2")]
	private Button _Button2;

	[CompilerGenerated]
	[AccessedThroughProperty("Button1")]
	private Button _Button1;

	[CompilerGenerated]
	[AccessedThroughProperty("ListBox1")]
	private ListBox _ListBox1;

	[CompilerGenerated]
	[AccessedThroughProperty("TextBox3")]
	private TextBox _TextBox3;

	[CompilerGenerated]
	[AccessedThroughProperty("TextBox2")]
	private TextBox _TextBox2;

	[CompilerGenerated]
	[AccessedThroughProperty("Button3")]
	private Button _Button3;

	[CompilerGenerated]
	[AccessedThroughProperty("ListBox2")]
	private ListBox _ListBox2;

	[CompilerGenerated]
	[AccessedThroughProperty("TextBox13")]
	private TextBox _TextBox13;

	[CompilerGenerated]
	[AccessedThroughProperty("Button5")]
	private Button _Button5;

	[CompilerGenerated]
	[AccessedThroughProperty("Button6")]
	private Button _Button6;

	[CompilerGenerated]
	[AccessedThroughProperty("TextBox8")]
	private TextBox _TextBox8;

	public string vehiculo;

	public DataRow[] Lista_cargas;

	private string[] currentRow;

	private ResourceManager RM;

	[field: AccessedThroughProperty("GroupBox1")]
	internal virtual GroupBox GroupBox1
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

	[field: AccessedThroughProperty("Label4")]
	internal virtual Label Label4
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

	[field: AccessedThroughProperty("Label2")]
	internal virtual Label Label2
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
			KeyPressEventHandler value2 = TextBox3_KeyPress;
			TextBox textBox = _TextBox3;
			if (textBox != null)
			{
				textBox.KeyPress -= value2;
			}
			_TextBox3 = value;
			textBox = _TextBox3;
			if (textBox != null)
			{
				textBox.KeyPress += value2;
			}
		}
	}

	internal virtual TextBox TextBox2
	{
		[CompilerGenerated]
		get
		{
			return _TextBox2;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			KeyPressEventHandler value2 = TextBox2_KeyPress;
			TextBox textBox = _TextBox2;
			if (textBox != null)
			{
				textBox.KeyPress -= value2;
			}
			_TextBox2 = value;
			textBox = _TextBox2;
			if (textBox != null)
			{
				textBox.KeyPress += value2;
			}
		}
	}

	[field: AccessedThroughProperty("Label7")]
	internal virtual Label Label7
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

	[field: AccessedThroughProperty("Label8")]
	internal virtual Label Label8
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

	[field: AccessedThroughProperty("TextBox7")]
	internal virtual TextBox TextBox7
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

	[field: AccessedThroughProperty("Button4")]
	internal virtual Button Button4
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

	[field: AccessedThroughProperty("Label6")]
	internal virtual Label Label6
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
			EventHandler value2 = ListBox2_SelectedIndexChanged;
			ListBox listBox = _ListBox2;
			if (listBox != null)
			{
				listBox.SelectedIndexChanged -= value2;
			}
			_ListBox2 = value;
			listBox = _ListBox2;
			if (listBox != null)
			{
				listBox.SelectedIndexChanged += value2;
			}
		}
	}

	[field: AccessedThroughProperty("Label13")]
	internal virtual Label Label13
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

	[field: AccessedThroughProperty("Label14")]
	internal virtual Label Label14
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual TextBox TextBox13
	{
		[CompilerGenerated]
		get
		{
			return _TextBox13;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = TextBox13_TextChanged;
			TextBox textBox = _TextBox13;
			if (textBox != null)
			{
				textBox.TextChanged -= value2;
			}
			_TextBox13 = value;
			textBox = _TextBox13;
			if (textBox != null)
			{
				textBox.TextChanged += value2;
			}
		}
	}

	[field: AccessedThroughProperty("TextBox12")]
	internal virtual TextBox TextBox12
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

	[field: AccessedThroughProperty("Label17")]
	internal virtual Label Label17
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
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

	[field: AccessedThroughProperty("TableAdapterManager")]
	internal virtual IncliGraph_V1._1_Pro.DatosDataSetTableAdapters.TableAdapterManager TableAdapterManager
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

	[field: AccessedThroughProperty("Label22")]
	internal virtual Label Label22
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

	[field: AccessedThroughProperty("TextBox15")]
	internal virtual TextBox TextBox15
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label24")]
	internal virtual Label Label24
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

	[field: AccessedThroughProperty("Label25")]
	internal virtual Label Label25
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

	[field: AccessedThroughProperty("Label26")]
	internal virtual Label Label26
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

	[field: AccessedThroughProperty("Label23")]
	internal virtual Label Label23
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

	[field: AccessedThroughProperty("Label10")]
	internal virtual Label Label10
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

	[field: AccessedThroughProperty("Label11")]
	internal virtual Label Label11
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

	[field: AccessedThroughProperty("TextBox21")]
	internal virtual TextBox TextBox21
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

	[field: AccessedThroughProperty("TextBox20")]
	internal virtual TextBox TextBox20
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

	internal virtual TextBox TextBox8
	{
		[CompilerGenerated]
		get
		{
			return _TextBox8;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = TextBox8_TextChanged;
			TextBox textBox = _TextBox8;
			if (textBox != null)
			{
				textBox.TextChanged -= value2;
			}
			_TextBox8 = value;
			textBox = _TextBox8;
			if (textBox != null)
			{
				textBox.TextChanged += value2;
			}
		}
	}

	[field: AccessedThroughProperty("Label1")]
	internal virtual Label Label1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("GroupBox4")]
	internal virtual GroupBox GroupBox4
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

	[field: AccessedThroughProperty("Label20")]
	internal virtual Label Label20
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox23")]
	internal virtual TextBox TextBox23
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

	[field: AccessedThroughProperty("TextBox24")]
	internal virtual TextBox TextBox24
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label27")]
	internal virtual Label Label27
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	public Base_Datos_Vehiculos()
	{
		base.FormClosing += Base_Datos_Vehiculos_FormClosing;
		base.Load += Base_Datos_Vehiculos_Load;
		base.Closed += Base_Datos_Vehiculos_Closed;
		vehiculo = "";
		RM = new ResourceManager("IncliGraph_V1._1_Pro.frases", Assembly.GetExecutingAssembly());
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
		System.ComponentModel.ComponentResourceManager componentResourceManager = new System.ComponentModel.ComponentResourceManager(typeof(IncliGraph_V1._1_Pro.Base_Datos_Vehiculos));
		this.GroupBox1 = new System.Windows.Forms.GroupBox();
		this.Button2 = new System.Windows.Forms.Button();
		this.Button1 = new System.Windows.Forms.Button();
		this.ListBox1 = new System.Windows.Forms.ListBox();
		this.RGBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.VehiculosDataSet = new IncliGraph_V1._1_Pro.VehiculosDataSet();
		this.GroupBox2 = new System.Windows.Forms.GroupBox();
		this.GroupBox4 = new System.Windows.Forms.GroupBox();
		this.TextBox22 = new System.Windows.Forms.TextBox();
		this.Label20 = new System.Windows.Forms.Label();
		this.TextBox23 = new System.Windows.Forms.TextBox();
		this.Label21 = new System.Windows.Forms.Label();
		this.TextBox24 = new System.Windows.Forms.TextBox();
		this.Label27 = new System.Windows.Forms.Label();
		this.GroupBox3 = new System.Windows.Forms.GroupBox();
		this.TextBox21 = new System.Windows.Forms.TextBox();
		this.Label19 = new System.Windows.Forms.Label();
		this.TextBox20 = new System.Windows.Forms.TextBox();
		this.Label12 = new System.Windows.Forms.Label();
		this.TextBox8 = new System.Windows.Forms.TextBox();
		this.Label1 = new System.Windows.Forms.Label();
		this.TextBox4 = new System.Windows.Forms.TextBox();
		this.TextBox7 = new System.Windows.Forms.TextBox();
		this.Label9 = new System.Windows.Forms.Label();
		this.Label8 = new System.Windows.Forms.Label();
		this.Label7 = new System.Windows.Forms.Label();
		this.Label5 = new System.Windows.Forms.Label();
		this.Label4 = new System.Windows.Forms.Label();
		this.Label3 = new System.Windows.Forms.Label();
		this.TextBox6 = new System.Windows.Forms.TextBox();
		this.TextBox5 = new System.Windows.Forms.TextBox();
		this.TextBox3 = new System.Windows.Forms.TextBox();
		this.TextBox1 = new System.Windows.Forms.TextBox();
		this.Button4 = new System.Windows.Forms.Button();
		this.TextBox2 = new System.Windows.Forms.TextBox();
		this.Label2 = new System.Windows.Forms.Label();
		this.Button3 = new System.Windows.Forms.Button();
		this.RGTableAdapter = new IncliGraph_V1._1_Pro.VehiculosDataSetTableAdapters.RGTableAdapter();
		this.GroupBox5 = new System.Windows.Forms.GroupBox();
		this.TextBox15 = new System.Windows.Forms.TextBox();
		this.Label24 = new System.Windows.Forms.Label();
		this.TextBox16 = new System.Windows.Forms.TextBox();
		this.Label25 = new System.Windows.Forms.Label();
		this.TextBox17 = new System.Windows.Forms.TextBox();
		this.Label26 = new System.Windows.Forms.Label();
		this.TextBox14 = new System.Windows.Forms.TextBox();
		this.Label23 = new System.Windows.Forms.Label();
		this.TextBox18 = new System.Windows.Forms.TextBox();
		this.Label10 = new System.Windows.Forms.Label();
		this.TextBox19 = new System.Windows.Forms.TextBox();
		this.Label11 = new System.Windows.Forms.Label();
		this.TextBox13 = new System.Windows.Forms.TextBox();
		this.TextBox12 = new System.Windows.Forms.TextBox();
		this.Label18 = new System.Windows.Forms.Label();
		this.Label17 = new System.Windows.Forms.Label();
		this.TextBox9 = new System.Windows.Forms.TextBox();
		this.Label14 = new System.Windows.Forms.Label();
		this.Label13 = new System.Windows.Forms.Label();
		this.ListBox2 = new System.Windows.Forms.ListBox();
		this.Label6 = new System.Windows.Forms.Label();
		this.DatosDataSet = new IncliGraph_V1._1_Pro.DatosDataSet();
		this.FechasBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.FechasTableAdapter = new IncliGraph_V1._1_Pro.DatosDataSetTableAdapters.FechasTableAdapter();
		this.TableAdapterManager = new IncliGraph_V1._1_Pro.DatosDataSetTableAdapters.TableAdapterManager();
		this.Button5 = new System.Windows.Forms.Button();
		this.Button6 = new System.Windows.Forms.Button();
		this.Label22 = new System.Windows.Forms.Label();
		this.GroupBox1.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.RGBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.VehiculosDataSet).BeginInit();
		this.GroupBox2.SuspendLayout();
		this.GroupBox4.SuspendLayout();
		this.GroupBox3.SuspendLayout();
		this.GroupBox5.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.DatosDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.FechasBindingSource).BeginInit();
		base.SuspendLayout();
		componentResourceManager.ApplyResources(this.GroupBox1, "GroupBox1");
		this.GroupBox1.Controls.Add(this.Button2);
		this.GroupBox1.Controls.Add(this.Button1);
		this.GroupBox1.Controls.Add(this.ListBox1);
		this.GroupBox1.Name = "GroupBox1";
		this.GroupBox1.TabStop = false;
		componentResourceManager.ApplyResources(this.Button2, "Button2");
		this.Button2.Name = "Button2";
		this.Button2.UseVisualStyleBackColor = true;
		componentResourceManager.ApplyResources(this.Button1, "Button1");
		this.Button1.Name = "Button1";
		this.Button1.UseVisualStyleBackColor = true;
		componentResourceManager.ApplyResources(this.ListBox1, "ListBox1");
		this.ListBox1.FormattingEnabled = true;
		this.ListBox1.Name = "ListBox1";
		this.RGBindingSource.DataMember = "RG";
		this.RGBindingSource.DataSource = this.VehiculosDataSet;
		this.VehiculosDataSet.DataSetName = "VehiculosDataSet";
		this.VehiculosDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		componentResourceManager.ApplyResources(this.GroupBox2, "GroupBox2");
		this.GroupBox2.Controls.Add(this.GroupBox4);
		this.GroupBox2.Controls.Add(this.GroupBox3);
		this.GroupBox2.Controls.Add(this.TextBox4);
		this.GroupBox2.Controls.Add(this.TextBox7);
		this.GroupBox2.Controls.Add(this.Label9);
		this.GroupBox2.Controls.Add(this.Label8);
		this.GroupBox2.Controls.Add(this.Label7);
		this.GroupBox2.Controls.Add(this.Label5);
		this.GroupBox2.Controls.Add(this.Label4);
		this.GroupBox2.Controls.Add(this.Label3);
		this.GroupBox2.Controls.Add(this.TextBox6);
		this.GroupBox2.Controls.Add(this.TextBox5);
		this.GroupBox2.Controls.Add(this.TextBox3);
		this.GroupBox2.Controls.Add(this.TextBox1);
		this.GroupBox2.Name = "GroupBox2";
		this.GroupBox2.TabStop = false;
		componentResourceManager.ApplyResources(this.GroupBox4, "GroupBox4");
		this.GroupBox4.Controls.Add(this.TextBox22);
		this.GroupBox4.Controls.Add(this.Label20);
		this.GroupBox4.Controls.Add(this.TextBox23);
		this.GroupBox4.Controls.Add(this.Label21);
		this.GroupBox4.Controls.Add(this.TextBox24);
		this.GroupBox4.Controls.Add(this.Label27);
		this.GroupBox4.Name = "GroupBox4";
		this.GroupBox4.TabStop = false;
		componentResourceManager.ApplyResources(this.TextBox22, "TextBox22");
		this.TextBox22.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource, "COEF2", true));
		this.TextBox22.Name = "TextBox22";
		componentResourceManager.ApplyResources(this.Label20, "Label20");
		this.Label20.Name = "Label20";
		componentResourceManager.ApplyResources(this.TextBox23, "TextBox23");
		this.TextBox23.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource, "ALFA2", true));
		this.TextBox23.Name = "TextBox23";
		componentResourceManager.ApplyResources(this.Label21, "Label21");
		this.Label21.Name = "Label21";
		componentResourceManager.ApplyResources(this.TextBox24, "TextBox24");
		this.TextBox24.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource, "D2", true));
		this.TextBox24.Name = "TextBox24";
		componentResourceManager.ApplyResources(this.Label27, "Label27");
		this.Label27.Name = "Label27";
		componentResourceManager.ApplyResources(this.GroupBox3, "GroupBox3");
		this.GroupBox3.Controls.Add(this.TextBox21);
		this.GroupBox3.Controls.Add(this.Label19);
		this.GroupBox3.Controls.Add(this.TextBox20);
		this.GroupBox3.Controls.Add(this.Label12);
		this.GroupBox3.Controls.Add(this.TextBox8);
		this.GroupBox3.Controls.Add(this.Label1);
		this.GroupBox3.Name = "GroupBox3";
		this.GroupBox3.TabStop = false;
		componentResourceManager.ApplyResources(this.TextBox21, "TextBox21");
		this.TextBox21.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource, "COEF1", true));
		this.TextBox21.Name = "TextBox21";
		componentResourceManager.ApplyResources(this.Label19, "Label19");
		this.Label19.Name = "Label19";
		componentResourceManager.ApplyResources(this.TextBox20, "TextBox20");
		this.TextBox20.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource, "ALFA1", true));
		this.TextBox20.Name = "TextBox20";
		componentResourceManager.ApplyResources(this.Label12, "Label12");
		this.Label12.Name = "Label12";
		componentResourceManager.ApplyResources(this.TextBox8, "TextBox8");
		this.TextBox8.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource, "D1", true));
		this.TextBox8.Name = "TextBox8";
		componentResourceManager.ApplyResources(this.Label1, "Label1");
		this.Label1.Name = "Label1";
		componentResourceManager.ApplyResources(this.TextBox4, "TextBox4");
		this.TextBox4.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource, "Matricula", true));
		this.TextBox4.Name = "TextBox4";
		componentResourceManager.ApplyResources(this.TextBox7, "TextBox7");
		this.TextBox7.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource, "Observaciones", true));
		this.TextBox7.Name = "TextBox7";
		componentResourceManager.ApplyResources(this.Label9, "Label9");
		this.Label9.Name = "Label9";
		componentResourceManager.ApplyResources(this.Label8, "Label8");
		this.Label8.Name = "Label8";
		componentResourceManager.ApplyResources(this.Label7, "Label7");
		this.Label7.Name = "Label7";
		componentResourceManager.ApplyResources(this.Label5, "Label5");
		this.Label5.Name = "Label5";
		componentResourceManager.ApplyResources(this.Label4, "Label4");
		this.Label4.Name = "Label4";
		componentResourceManager.ApplyResources(this.Label3, "Label3");
		this.Label3.Name = "Label3";
		componentResourceManager.ApplyResources(this.TextBox6, "TextBox6");
		this.TextBox6.BackColor = System.Drawing.Color.White;
		this.TextBox6.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource, "Fecha_Carga", true));
		this.TextBox6.Name = "TextBox6";
		this.TextBox6.ReadOnly = true;
		componentResourceManager.ApplyResources(this.TextBox5, "TextBox5");
		this.TextBox5.BackColor = System.Drawing.Color.White;
		this.TextBox5.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource, "Datos_Cargados", true));
		this.TextBox5.Name = "TextBox5";
		this.TextBox5.ReadOnly = true;
		componentResourceManager.ApplyResources(this.TextBox3, "TextBox3");
		this.TextBox3.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource, "Num_Identificacion", true));
		this.TextBox3.Name = "TextBox3";
		componentResourceManager.ApplyResources(this.TextBox1, "TextBox1");
		this.TextBox1.BackColor = System.Drawing.SystemColors.Control;
		this.TextBox1.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource, "Id", true));
		this.TextBox1.Name = "TextBox1";
		this.TextBox1.ReadOnly = true;
		componentResourceManager.ApplyResources(this.Button4, "Button4");
		this.Button4.Name = "Button4";
		this.Button4.UseVisualStyleBackColor = true;
		componentResourceManager.ApplyResources(this.TextBox2, "TextBox2");
		this.TextBox2.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource, "Identificador", true));
		this.TextBox2.Name = "TextBox2";
		componentResourceManager.ApplyResources(this.Label2, "Label2");
		this.Label2.Name = "Label2";
		componentResourceManager.ApplyResources(this.Button3, "Button3");
		this.Button3.Name = "Button3";
		this.Button3.UseVisualStyleBackColor = true;
		this.RGTableAdapter.ClearBeforeFill = true;
		componentResourceManager.ApplyResources(this.GroupBox5, "GroupBox5");
		this.GroupBox5.Controls.Add(this.TextBox15);
		this.GroupBox5.Controls.Add(this.Label24);
		this.GroupBox5.Controls.Add(this.TextBox16);
		this.GroupBox5.Controls.Add(this.Label25);
		this.GroupBox5.Controls.Add(this.TextBox17);
		this.GroupBox5.Controls.Add(this.Label26);
		this.GroupBox5.Controls.Add(this.TextBox14);
		this.GroupBox5.Controls.Add(this.Label23);
		this.GroupBox5.Controls.Add(this.TextBox18);
		this.GroupBox5.Controls.Add(this.Label10);
		this.GroupBox5.Controls.Add(this.TextBox19);
		this.GroupBox5.Controls.Add(this.Label11);
		this.GroupBox5.Controls.Add(this.TextBox13);
		this.GroupBox5.Controls.Add(this.TextBox12);
		this.GroupBox5.Controls.Add(this.Label18);
		this.GroupBox5.Controls.Add(this.Label17);
		this.GroupBox5.Controls.Add(this.TextBox9);
		this.GroupBox5.Controls.Add(this.Label14);
		this.GroupBox5.Controls.Add(this.Label13);
		this.GroupBox5.Controls.Add(this.ListBox2);
		this.GroupBox5.Controls.Add(this.Label6);
		this.GroupBox5.Name = "GroupBox5";
		this.GroupBox5.TabStop = false;
		componentResourceManager.ApplyResources(this.TextBox15, "TextBox15");
		this.TextBox15.BackColor = System.Drawing.Color.White;
		this.TextBox15.Name = "TextBox15";
		this.TextBox15.ReadOnly = true;
		componentResourceManager.ApplyResources(this.Label24, "Label24");
		this.Label24.Name = "Label24";
		componentResourceManager.ApplyResources(this.TextBox16, "TextBox16");
		this.TextBox16.BackColor = System.Drawing.Color.White;
		this.TextBox16.Name = "TextBox16";
		this.TextBox16.ReadOnly = true;
		componentResourceManager.ApplyResources(this.Label25, "Label25");
		this.Label25.Name = "Label25";
		componentResourceManager.ApplyResources(this.TextBox17, "TextBox17");
		this.TextBox17.BackColor = System.Drawing.Color.White;
		this.TextBox17.Name = "TextBox17";
		this.TextBox17.ReadOnly = true;
		componentResourceManager.ApplyResources(this.Label26, "Label26");
		this.Label26.Name = "Label26";
		componentResourceManager.ApplyResources(this.TextBox14, "TextBox14");
		this.TextBox14.BackColor = System.Drawing.Color.White;
		this.TextBox14.Name = "TextBox14";
		this.TextBox14.ReadOnly = true;
		componentResourceManager.ApplyResources(this.Label23, "Label23");
		this.Label23.Name = "Label23";
		componentResourceManager.ApplyResources(this.TextBox18, "TextBox18");
		this.TextBox18.BackColor = System.Drawing.Color.White;
		this.TextBox18.Name = "TextBox18";
		this.TextBox18.ReadOnly = true;
		componentResourceManager.ApplyResources(this.Label10, "Label10");
		this.Label10.Name = "Label10";
		componentResourceManager.ApplyResources(this.TextBox19, "TextBox19");
		this.TextBox19.BackColor = System.Drawing.Color.White;
		this.TextBox19.Name = "TextBox19";
		this.TextBox19.ReadOnly = true;
		componentResourceManager.ApplyResources(this.Label11, "Label11");
		this.Label11.Name = "Label11";
		componentResourceManager.ApplyResources(this.TextBox13, "TextBox13");
		this.TextBox13.BackColor = System.Drawing.Color.White;
		this.TextBox13.Name = "TextBox13";
		this.TextBox13.ReadOnly = true;
		componentResourceManager.ApplyResources(this.TextBox12, "TextBox12");
		this.TextBox12.BackColor = System.Drawing.Color.White;
		this.TextBox12.Name = "TextBox12";
		this.TextBox12.ReadOnly = true;
		componentResourceManager.ApplyResources(this.Label18, "Label18");
		this.Label18.Name = "Label18";
		componentResourceManager.ApplyResources(this.Label17, "Label17");
		this.Label17.Name = "Label17";
		componentResourceManager.ApplyResources(this.TextBox9, "TextBox9");
		this.TextBox9.BackColor = System.Drawing.Color.White;
		this.TextBox9.Name = "TextBox9";
		this.TextBox9.ReadOnly = true;
		componentResourceManager.ApplyResources(this.Label14, "Label14");
		this.Label14.Name = "Label14";
		componentResourceManager.ApplyResources(this.Label13, "Label13");
		this.Label13.Name = "Label13";
		componentResourceManager.ApplyResources(this.ListBox2, "ListBox2");
		this.ListBox2.FormattingEnabled = true;
		this.ListBox2.Name = "ListBox2";
		componentResourceManager.ApplyResources(this.Label6, "Label6");
		this.Label6.Name = "Label6";
		this.DatosDataSet.DataSetName = "DatosDataSet";
		this.DatosDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.FechasBindingSource.DataMember = "Fechas";
		this.FechasBindingSource.DataSource = this.DatosDataSet;
		this.FechasTableAdapter.ClearBeforeFill = true;
		this.TableAdapterManager.BackupDataSetBeforeUpdate = false;
		this.TableAdapterManager.datosappTableAdapter = null;
		this.TableAdapterManager.DescargasTableAdapter = null;
		this.TableAdapterManager.FechasTableAdapter = this.FechasTableAdapter;
		this.TableAdapterManager.UpdateOrder = IncliGraph_V1._1_Pro.DatosDataSetTableAdapters.TableAdapterManager.UpdateOrderOption.InsertUpdateDelete;
		componentResourceManager.ApplyResources(this.Button5, "Button5");
		this.Button5.Name = "Button5";
		this.Button5.UseVisualStyleBackColor = true;
		componentResourceManager.ApplyResources(this.Button6, "Button6");
		this.Button6.Name = "Button6";
		this.Button6.UseVisualStyleBackColor = true;
		componentResourceManager.ApplyResources(this.Label22, "Label22");
		this.Label22.Name = "Label22";
		componentResourceManager.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.Label22);
		base.Controls.Add(this.Button6);
		base.Controls.Add(this.Button5);
		base.Controls.Add(this.Button4);
		base.Controls.Add(this.GroupBox5);
		base.Controls.Add(this.Button3);
		base.Controls.Add(this.GroupBox2);
		base.Controls.Add(this.TextBox2);
		base.Controls.Add(this.Label2);
		base.Controls.Add(this.GroupBox1);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.Fixed3D;
		base.Name = "Base_Datos_Vehiculos";
		base.ShowIcon = false;
		this.GroupBox1.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.RGBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.VehiculosDataSet).EndInit();
		this.GroupBox2.ResumeLayout(false);
		this.GroupBox2.PerformLayout();
		this.GroupBox4.ResumeLayout(false);
		this.GroupBox4.PerformLayout();
		this.GroupBox3.ResumeLayout(false);
		this.GroupBox3.PerformLayout();
		this.GroupBox5.ResumeLayout(false);
		this.GroupBox5.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.DatosDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.FechasBindingSource).EndInit();
		base.ResumeLayout(false);
		base.PerformLayout();
	}

	private void Button3_Click(object sender, EventArgs e)
	{
		Close();
	}

	private void Base_Datos_Vehiculos_FormClosing(object sender, FormClosingEventArgs e)
	{
		Validate();
		RGBindingSource.EndEdit();
		RGTableAdapter.Update(VehiculosDataSet.RG);
		MyProject.Forms.Principal.Visible = true;
	}

	private void Base_Datos_Vehiculos_Load(object sender, EventArgs e)
	{
		RGTableAdapter.Fill(VehiculosDataSet.RG);
		FechasTableAdapter.Fill(DatosDataSet.Fechas);
		if (RGBindingSource.Count == 0)
		{
			cargarCSV();
		}
		actualizar_lista();
		actualizar();
		actualizar_casillas();
		_ = MyProject.Forms.Principal.user;
		_ = 2;
	}

	private void actualizar()
	{
		if (RGBindingSource.Count == 0)
		{
			GroupBox2.Enabled = false;
		}
		else
		{
			GroupBox2.Enabled = true;
		}
	}

	private void actualizar_casillas()
	{
		if (RGBindingSource.Count != 0)
		{
			if (Operators.CompareString(VehiculosDataSet.RG[RGBindingSource.Position].Datos_Cargados, "Datos sin cargar", TextCompare: false) == 0)
			{
				TextBox5.ForeColor = Color.Red;
			}
			else
			{
				TextBox5.ForeColor = Color.Black;
			}
		}
	}

	private void actualizar_lista()
	{
		int count = RGBindingSource.Count;
		if (count == 0)
		{
			ListBox1.Items.Clear();
			ListBox1.Items.Add(RM.GetString("sinvehiculos"));
			Label22.Text = RM.GetString("totalvehiculos") + " 0";
			return;
		}
		ListBox1.Items.Clear();
		checked
		{
			int num = count - 1;
			for (int i = 0; i <= num; i++)
			{
				RGBindingSource.Position = i;
				ListBox1.Items.Add(VehiculosDataSet.RG[RGBindingSource.Position].Matricula);
				ListBox1.SelectedIndex = 0;
				Label22.Text = RM.GetString("totalvehiculos") + " " + Conversions.ToString(ListBox1.Items.Count);
			}
		}
	}

	private void TextBox2_KeyPress(object sender, KeyPressEventArgs e)
	{
		if (e.KeyChar == Convert.ToChar(8))
		{
			e.Handled = false;
		}
		else if ((e.KeyChar <= Convert.ToChar(57)) & (e.KeyChar >= Convert.ToChar(48)))
		{
			e.Handled = false;
		}
		else if ((e.KeyChar == Convert.ToChar(44)) | (e.KeyChar == Convert.ToChar(46)))
		{
			e.Handled = false;
		}
		else if ((e.KeyChar <= Convert.ToChar(90)) & (e.KeyChar >= Convert.ToChar(65)))
		{
			e.Handled = false;
		}
		else if ((e.KeyChar <= Convert.ToChar(122)) & (e.KeyChar >= Convert.ToChar(97)))
		{
			e.Handled = false;
		}
		else
		{
			e.Handled = true;
		}
	}

	private void TextBox3_KeyPress(object sender, KeyPressEventArgs e)
	{
		if (e.KeyChar == Convert.ToChar(8))
		{
			e.Handled = false;
		}
		else if ((e.KeyChar <= Convert.ToChar(57)) & (e.KeyChar >= Convert.ToChar(48)))
		{
			e.Handled = false;
		}
		else if ((e.KeyChar == Convert.ToChar(44)) | (e.KeyChar == Convert.ToChar(46)))
		{
			e.Handled = false;
		}
		else if ((e.KeyChar <= Convert.ToChar(90)) & (e.KeyChar >= Convert.ToChar(65)))
		{
			e.Handled = false;
		}
		else if ((e.KeyChar <= Convert.ToChar(122)) & (e.KeyChar >= Convert.ToChar(97)))
		{
			e.Handled = false;
		}
		else
		{
			e.Handled = true;
		}
	}

	private void Button1_Click(object sender, EventArgs e)
	{
		VehiculosDataSet.RGDataTable rG = VehiculosDataSet.RG;
		DataRowCollection rows = rG.Rows;
		DataRow dataRow = rG.NewRow();
		checked
		{
			RGBindingSource.Position = RGBindingSource.Count - 1;
			if (RGBindingSource.Count == 0)
			{
				dataRow[0] = 1;
				dataRow[9] = "Vehículo 1";
			}
			else
			{
				int num = 0;
				int num2 = RGBindingSource.Count - 1;
				for (int i = 0; i <= num2; i++)
				{
					RGBindingSource.Position = i;
					if (Conversions.ToDouble(VehiculosDataSet.RG[RGBindingSource.Position].Id) > (double)num)
					{
						num = Conversions.ToInteger(VehiculosDataSet.RG[RGBindingSource.Position].Id);
					}
				}
				dataRow[0] = num + 1;
				dataRow[9] = Operators.ConcatenateObject("Vehículo RG ", dataRow[0]);
			}
			dataRow[1] = "-";
			dataRow[2] = "";
			dataRow[3] = "0000AAA";
			dataRow[4] = "Sin Carga";
			dataRow[5] = "Con Carga";
			dataRow[6] = "Datos sin cargar";
			dataRow[7] = "Datos sin cargar";
			dataRow[8] = "";
			dataRow[10] = "30";
			dataRow[11] = "25";
			dataRow[12] = "20";
			dataRow[13] = "15";
			dataRow[14] = "30";
			dataRow[15] = "25";
			dataRow[16] = "20";
			dataRow[17] = "15";
			dataRow[18] = "1,25";
			dataRow[19] = "1,25";
			dataRow[20] = "1,25";
			dataRow[21] = "1,25";
			rows.Add(dataRow);
			Validate();
			RGBindingSource.EndEdit();
			RGTableAdapter.Update(VehiculosDataSet.RG);
			RGBindingSource.Position = RGBindingSource.Count - 1;
			actualizar_lista();
			actualizar();
			actualizar_casillas();
		}
	}

	private void Button2_Click(object sender, EventArgs e)
	{
		string newLine = Environment.NewLine;
		if (Operators.CompareString(VehiculosDataSet.RG[RGBindingSource.Position].Datos_Cargados, "Datos cargados", TextCompare: false) == 0)
		{
			Interaction.MsgBox(RM.GetString("noborrar"), MsgBoxStyle.OkOnly, "IncliSoft VEXT-IS1");
		}
		else if (RGBindingSource.Count != 0 && MessageBox.Show(RM.GetString("borrar2") + newLine, RM.GetString("borrar1"), MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)
		{
			NewLateBinding.LateCall(NewLateBinding.LateGet(RGBindingSource.Current, null, "row", new object[0], null, null, null), null, "delete", new object[0], null, null, null, IgnoreReturn: true);
			Validate();
			RGBindingSource.EndEdit();
			RGTableAdapter.Update(VehiculosDataSet.RG);
			actualizar_lista();
			actualizar();
			actualizar_casillas();
		}
	}

	private void ListBox1_SelectedIndexChanged(object sender, EventArgs e)
	{
		RGBindingSource.Position = ListBox1.SelectedIndex;
		Actualizar_Historial();
	}

	private void Actualizar_Historial()
	{
		if (ListBox1.SelectedIndex >= 0)
		{
			vehiculo = VehiculosDataSet.RG[ListBox1.SelectedIndex].Matricula;
		}
		string text = vehiculo;
		if (text.Length == 1)
		{
			text = "00000" + text;
		}
		else if (text.Length == 2)
		{
			text = "0000" + text;
		}
		else if (text.Length == 3)
		{
			text = "000" + text;
		}
		else if (text.Length == 4)
		{
			text = "00" + text;
		}
		else if (text.Length == 5)
		{
			text = "0" + text;
		}
		string filterExpression = "Id_RG like '" + text + "'";
		Lista_cargas = DatosDataSet.Fechas.Select(filterExpression);
		if (Lista_cargas.GetUpperBound(0) == -1)
		{
			ListBox2.Items.Clear();
			ListBox2.Items.Add("Sin datos.");
		}
		else
		{
			ListBox2.Items.Clear();
			int upperBound = Lista_cargas.GetUpperBound(0);
			for (int i = 0; i <= upperBound; i = checked(i + 1))
			{
				string item = Conversions.ToString(Lista_cargas[i][1]);
				ListBox2.Items.Add(item);
			}
		}
		ListBox2.SelectedIndex = 0;
		actualizar_casillas_cargas();
	}

	private void actualizar_casillas_cargas()
	{
		if (Operators.ConditionalCompareObjectEqual(ListBox2.SelectedItem, "Sin datos.", TextCompare: false))
		{
			TextBox9.Text = "";
			TextBox12.Text = "";
			TextBox13.Text = "";
			return;
		}
		TextBox12.Text = Conversions.ToString(Lista_cargas[ListBox2.SelectedIndex][4]);
		TextBox9.Text = Conversions.ToString(Lista_cargas[ListBox2.SelectedIndex][2]);
		TextBox19.Text = Conversions.ToString(Lista_cargas[ListBox2.SelectedIndex][8]);
		TextBox18.Text = Conversions.ToString(Lista_cargas[ListBox2.SelectedIndex][9]);
		TextBox14.Text = Conversions.ToString(Lista_cargas[ListBox2.SelectedIndex][10]);
		TextBox17.Text = Conversions.ToString(Lista_cargas[ListBox2.SelectedIndex][11]);
		TextBox16.Text = Conversions.ToString(Lista_cargas[ListBox2.SelectedIndex][12]);
		TextBox15.Text = Conversions.ToString(Lista_cargas[ListBox2.SelectedIndex][13]);
		string text = "";
		string path = Conversions.ToString(Lista_cargas[ListBox2.SelectedIndex][7]);
		try
		{
			using (StreamReader streamReader = new StreamReader(path))
			{
				text = streamReader.ReadToEnd();
				streamReader.Close();
			}
			TextBox13.Text = text;
		}
		catch (Exception ex)
		{
			ProjectData.SetProjectError(ex);
			Exception ex2 = ex;
			TextBox13.Text = "No se ha podido leer el archivo de Carga de Datos";
			ProjectData.ClearProjectError();
		}
	}

	private void ListBox2_SelectedIndexChanged(object sender, EventArgs e)
	{
		actualizar_casillas_cargas();
	}

	private void cargarCSV()
	{
		string newLine = Environment.NewLine;
		new OpenFileDialog
		{
			InitialDirectory = "c:\\",
			Filter = "csv files (*.csv)|*.csv|All files (*.*)|*.*",
			FilterIndex = 1,
			RestoreDirectory = true
		};
		string startupPath = Application.StartupPath;
		startupPath += "\\Resources\\LISTADO.csv";
		_ = RGBindingSource.Count;
		DataTable rG = VehiculosDataSet.RG;
		DataRowCollection rows = rG.Rows;
		string text = "";
		checked
		{
			using TextFieldParser textFieldParser = new TextFieldParser(startupPath);
			textFieldParser.TextFieldType = FieldType.Delimited;
			textFieldParser.SetDelimiters(";");
			int num = 0;
			while (!textFieldParser.EndOfData)
			{
				DataRow dataRow = rG.NewRow();
				try
				{
					currentRow = textFieldParser.ReadFields();
					dataRow[0] = num + 1;
					dataRow[9] = Operators.ConcatenateObject("Vehículo ", dataRow[0]);
					dataRow[1] = "-";
					dataRow[2] = currentRow[2];
					string value = Strings.Split(Strings.Split(currentRow[4], " ", -1, CompareMethod.Text)[1], "-", -1, CompareMethod.Text)[0];
					dataRow[3] = value;
					dataRow[4] = "Sin Carga";
					dataRow[5] = "Con Carga";
					dataRow[6] = "Datos sin cargar";
					dataRow[7] = "Datos sin cargar";
					text = "NOC: " + currentRow[0] + newLine + currentRow[1] + newLine + " Unidad: " + currentRow[3];
					dataRow[8] = text;
					dataRow[10] = "30";
					dataRow[11] = "25";
					dataRow[12] = "20";
					dataRow[13] = "15";
					dataRow[14] = "30";
					dataRow[15] = "25";
					dataRow[16] = "20";
					dataRow[17] = "15";
					dataRow[18] = "1,25";
					dataRow[19] = "1,25";
					dataRow[20] = "1,25";
					dataRow[21] = "1,25";
					rows.Add(dataRow);
					num++;
				}
				catch (MalformedLineException ex)
				{
					ProjectData.SetProjectError(ex);
					MalformedLineException ex2 = ex;
					Interaction.MsgBox("La línea " + ex2.Message + "no es válida y será ignorada.", MsgBoxStyle.OkOnly, "Información");
					ProjectData.ClearProjectError();
				}
			}
			RGBindingSource.EndEdit();
			RGTableAdapter.Update(VehiculosDataSet.RG);
			RGTableAdapter.Fill(VehiculosDataSet.RG);
			RGBindingSource.Position = RGBindingSource.Count - 1;
			actualizar_lista();
			actualizar();
			actualizar_casillas();
		}
	}

	public void ImportarCSV()
	{
		string newLine = Environment.NewLine;
		OpenFileDialog openFileDialog = new OpenFileDialog();
		openFileDialog.InitialDirectory = "c:\\";
		openFileDialog.Filter = "csv files (*.csv)|*.csv|All files (*.*)|*.*";
		openFileDialog.FilterIndex = 1;
		openFileDialog.RestoreDirectory = true;
		int num = 0;
		if (openFileDialog.ShowDialog() != DialogResult.OK)
		{
			return;
		}
		string fileName = openFileDialog.FileName;
		_ = RGBindingSource.Count;
		checked
		{
			RGBindingSource.Position = RGBindingSource.Count - 1;
			int num2 = Conversions.ToInteger(VehiculosDataSet.RG[RGBindingSource.Position].Id);
			DataTable rG = VehiculosDataSet.RG;
			DataRowCollection rows = rG.Rows;
			string text = "";
			using TextFieldParser textFieldParser = new TextFieldParser(fileName);
			textFieldParser.TextFieldType = FieldType.Delimited;
			textFieldParser.SetDelimiters(";");
			int num3 = 0;
			int num4 = 0;
			while (!textFieldParser.EndOfData)
			{
				DataRow dataRow = rG.NewRow();
				try
				{
					currentRow = textFieldParser.ReadFields();
					dataRow[9] = Operators.ConcatenateObject("Vehículo RG ", dataRow[0]);
					dataRow[1] = "-";
					dataRow[2] = currentRow[2];
					string value = Strings.Split(Strings.Split(currentRow[4], " ", -1, CompareMethod.Text)[1], "-", -1, CompareMethod.Text)[0];
					dataRow[3] = value;
					dataRow[4] = "Instrucción/Mando";
					dataRow[5] = "Combate";
					dataRow[6] = "Datos sin cargar";
					dataRow[7] = "Datos sin cargar";
					text = "NOC: " + currentRow[0] + newLine + currentRow[1] + newLine + " Unidad: " + currentRow[3];
					dataRow[8] = text;
					dataRow[10] = "30";
					dataRow[11] = "25";
					dataRow[12] = "20";
					dataRow[13] = "15";
					dataRow[14] = "30";
					dataRow[15] = "25";
					dataRow[16] = "20";
					dataRow[17] = "15";
					dataRow[18] = "1.25";
					dataRow[19] = "1.25";
					dataRow[20] = "1.25";
					dataRow[21] = "1.25";
					if (VehiculosDataSet.RG.Select("Matricula like '" + Conversions.ToString(dataRow[3]) + "'").Length == 0)
					{
						dataRow[0] = num2 + num3 + 1;
						rows.Add(dataRow);
						num3++;
					}
					else
					{
						num++;
					}
					num4++;
				}
				catch (MalformedLineException ex)
				{
					ProjectData.SetProjectError(ex);
					MalformedLineException ex2 = ex;
					Interaction.MsgBox("La línea " + ex2.Message + "no es válida y será ignorada.", MsgBoxStyle.OkOnly, "Información");
					ProjectData.ClearProjectError();
				}
			}
			RGBindingSource.EndEdit();
			RGTableAdapter.Update(VehiculosDataSet.RG);
			RGTableAdapter.Fill(VehiculosDataSet.RG);
			RGBindingSource.Position = RGBindingSource.Count - 1;
			actualizar_lista();
			actualizar();
			actualizar_casillas();
			if (num > 0)
			{
				Interaction.MsgBox("Se han encontrado " + Conversions.ToString(num) + " coincidencias de vehículos que ya se encontraban " + newLine + "en la base de datos y no han sido importados. Se han importado " + Conversions.ToString(num4 - num) + " vehículos.", MsgBoxStyle.OkOnly, "Importación concluida");
			}
		}
	}

	private void Button5_Click(object sender, EventArgs e)
	{
		int count = RGBindingSource.Count;
		if (count != 0)
		{
			int num = count;
			for (int i = 1; i <= num; i = checked(i + 1))
			{
				RGBindingSource.MoveLast();
				NewLateBinding.LateCall(NewLateBinding.LateGet(RGBindingSource.Current, null, "row", new object[0], null, null, null), null, "delete", new object[0], null, null, null, IgnoreReturn: true);
			}
			Validate();
			RGBindingSource.EndEdit();
			RGTableAdapter.Update(VehiculosDataSet.RG);
		}
	}

	private void Button6_Click(object sender, EventArgs e)
	{
		MyProject.Forms.importacion.Show();
	}

	private void Base_Datos_Vehiculos_Closed(object sender, EventArgs e)
	{
	}

	private void TextBox8_TextChanged(object sender, EventArgs e)
	{
	}

	private void TextBox13_TextChanged(object sender, EventArgs e)
	{
	}
}
