using System;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.Runtime.CompilerServices;
using System.Windows.Forms;
using IncliGraph_V1._1_Pro.DatosDataSetTableAdapters;
using IncliGraph_V1._1_Pro.My;
using IncliGraph_V1._1_Pro.VehiculosDataSetTableAdapters;
using Microsoft.VisualBasic;
using Microsoft.VisualBasic.CompilerServices;

namespace IncliGraph_V1._1_Pro;

[DesignerGenerated]
public class Base_Datos : Form
{
	private IContainer components;

	[CompilerGenerated]
	[AccessedThroughProperty("Button1")]
	private Button _Button1;

	[CompilerGenerated]
	[AccessedThroughProperty("ListBox1")]
	private ListBox _ListBox1;

	[CompilerGenerated]
	[AccessedThroughProperty("Button2")]
	private Button _Button2;

	[CompilerGenerated]
	[AccessedThroughProperty("MatriculaTextBox")]
	private TextBox _MatriculaTextBox;

	[CompilerGenerated]
	[AccessedThroughProperty("Num_IdentificacionTextBox")]
	private TextBox _Num_IdentificacionTextBox;

	[CompilerGenerated]
	[AccessedThroughProperty("Config_2ComboBox")]
	private ComboBox _Config_2ComboBox;

	[CompilerGenerated]
	[AccessedThroughProperty("Config_1ComboBox")]
	private ComboBox _Config_1ComboBox;

	[CompilerGenerated]
	[AccessedThroughProperty("IdentificadorTextBox")]
	private TextBox _IdentificadorTextBox;

	[CompilerGenerated]
	[AccessedThroughProperty("Button3")]
	private Button _Button3;

	[CompilerGenerated]
	[AccessedThroughProperty("Button4")]
	private Button _Button4;

	[CompilerGenerated]
	[AccessedThroughProperty("ListBox2")]
	private ListBox _ListBox2;

	private int boton_aceptar;

	private int desplegado;

	private DataRow[] Lista_cargas;

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

	[field: AccessedThroughProperty("GroupBox1")]
	internal virtual GroupBox GroupBox1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
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

	[field: AccessedThroughProperty("GroupBox2")]
	internal virtual GroupBox GroupBox2
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

	[field: AccessedThroughProperty("TableAdapterManager")]
	internal virtual IncliGraph_V1._1_Pro.VehiculosDataSetTableAdapters.TableAdapterManager TableAdapterManager
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("IdTextBox")]
	internal virtual TextBox IdTextBox
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual TextBox MatriculaTextBox
	{
		[CompilerGenerated]
		get
		{
			return _MatriculaTextBox;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			KeyPressEventHandler value2 = MatriculaTextBox_KeyPress;
			TextBox textBox = _MatriculaTextBox;
			if (textBox != null)
			{
				textBox.KeyPress -= value2;
			}
			_MatriculaTextBox = value;
			textBox = _MatriculaTextBox;
			if (textBox != null)
			{
				textBox.KeyPress += value2;
			}
		}
	}

	internal virtual TextBox Num_IdentificacionTextBox
	{
		[CompilerGenerated]
		get
		{
			return _Num_IdentificacionTextBox;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			KeyPressEventHandler value2 = Num_IdentificacionTextBox_KeyPress;
			TextBox textBox = _Num_IdentificacionTextBox;
			if (textBox != null)
			{
				textBox.KeyPress -= value2;
			}
			_Num_IdentificacionTextBox = value;
			textBox = _Num_IdentificacionTextBox;
			if (textBox != null)
			{
				textBox.KeyPress += value2;
			}
		}
	}

	[field: AccessedThroughProperty("ObservacionesTextBox")]
	internal virtual TextBox ObservacionesTextBox
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual ComboBox Config_2ComboBox
	{
		[CompilerGenerated]
		get
		{
			return _Config_2ComboBox;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			KeyEventHandler value2 = Config_2ComboBox_KeyUp;
			ComboBox comboBox = _Config_2ComboBox;
			if (comboBox != null)
			{
				comboBox.KeyUp -= value2;
			}
			_Config_2ComboBox = value;
			comboBox = _Config_2ComboBox;
			if (comboBox != null)
			{
				comboBox.KeyUp += value2;
			}
		}
	}

	internal virtual ComboBox Config_1ComboBox
	{
		[CompilerGenerated]
		get
		{
			return _Config_1ComboBox;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			KeyEventHandler value2 = Config_1ComboBox_KeyUp;
			ComboBox comboBox = _Config_1ComboBox;
			if (comboBox != null)
			{
				comboBox.KeyUp -= value2;
			}
			_Config_1ComboBox = value;
			comboBox = _Config_1ComboBox;
			if (comboBox != null)
			{
				comboBox.KeyUp += value2;
			}
		}
	}

	[field: AccessedThroughProperty("Datos_CargadosTextBox")]
	internal virtual TextBox Datos_CargadosTextBox
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Fecha_CargaTextBox")]
	internal virtual TextBox Fecha_CargaTextBox
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual TextBox IdentificadorTextBox
	{
		[CompilerGenerated]
		get
		{
			return _IdentificadorTextBox;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			KeyPressEventHandler value2 = IdentificadorTextBox_KeyPress;
			TextBox textBox = _IdentificadorTextBox;
			if (textBox != null)
			{
				textBox.KeyPress -= value2;
			}
			_IdentificadorTextBox = value;
			textBox = _IdentificadorTextBox;
			if (textBox != null)
			{
				textBox.KeyPress += value2;
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

	[field: AccessedThroughProperty("GroupBox4")]
	internal virtual GroupBox GroupBox4
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

	[field: AccessedThroughProperty("Label2")]
	internal virtual Label Label2
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

	[field: AccessedThroughProperty("Label3")]
	internal virtual Label Label3
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

	[field: AccessedThroughProperty("TextBox1")]
	internal virtual TextBox TextBox1
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

	[field: AccessedThroughProperty("TextBox4")]
	internal virtual TextBox TextBox4
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

	public Base_Datos()
	{
		base.FormClosing += Base_Datos_FormClosing;
		base.Load += Base_Datos_Load;
		boton_aceptar = 0;
		desplegado = 0;
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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(IncliGraph_V1._1_Pro.Base_Datos));
		this.Button1 = new System.Windows.Forms.Button();
		this.GroupBox1 = new System.Windows.Forms.GroupBox();
		this.Button3 = new System.Windows.Forms.Button();
		this.Button2 = new System.Windows.Forms.Button();
		this.ListBox1 = new System.Windows.Forms.ListBox();
		this.RGBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.VehiculosDataSet = new IncliGraph_V1._1_Pro.VehiculosDataSet();
		this.GroupBox2 = new System.Windows.Forms.GroupBox();
		this.Button4 = new System.Windows.Forms.Button();
		this.Label2 = new System.Windows.Forms.Label();
		this.Label1 = new System.Windows.Forms.Label();
		this.GroupBox4 = new System.Windows.Forms.GroupBox();
		this.Config_2ComboBox = new System.Windows.Forms.ComboBox();
		this.GroupBox3 = new System.Windows.Forms.GroupBox();
		this.Config_1ComboBox = new System.Windows.Forms.ComboBox();
		this.IdentificadorTextBox = new System.Windows.Forms.TextBox();
		this.Fecha_CargaTextBox = new System.Windows.Forms.TextBox();
		this.Datos_CargadosTextBox = new System.Windows.Forms.TextBox();
		this.ObservacionesTextBox = new System.Windows.Forms.TextBox();
		this.MatriculaTextBox = new System.Windows.Forms.TextBox();
		this.Num_IdentificacionTextBox = new System.Windows.Forms.TextBox();
		this.IdTextBox = new System.Windows.Forms.TextBox();
		this.RGTableAdapter = new IncliGraph_V1._1_Pro.VehiculosDataSetTableAdapters.RGTableAdapter();
		this.TableAdapterManager = new IncliGraph_V1._1_Pro.VehiculosDataSetTableAdapters.TableAdapterManager();
		this.Label3 = new System.Windows.Forms.Label();
		this.ListBox2 = new System.Windows.Forms.ListBox();
		this.DatosDataSet = new IncliGraph_V1._1_Pro.DatosDataSet();
		this.FechasBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.FechasTableAdapter = new IncliGraph_V1._1_Pro.DatosDataSetTableAdapters.FechasTableAdapter();
		this.TableAdapterManager1 = new IncliGraph_V1._1_Pro.DatosDataSetTableAdapters.TableAdapterManager();
		this.TextBox1 = new System.Windows.Forms.TextBox();
		this.TextBox2 = new System.Windows.Forms.TextBox();
		this.TextBox3 = new System.Windows.Forms.TextBox();
		this.TextBox4 = new System.Windows.Forms.TextBox();
		this.TextBox5 = new System.Windows.Forms.TextBox();
		this.TextBox6 = new System.Windows.Forms.TextBox();
		System.Windows.Forms.Label label = new System.Windows.Forms.Label();
		System.Windows.Forms.Label label2 = new System.Windows.Forms.Label();
		System.Windows.Forms.Label label3 = new System.Windows.Forms.Label();
		System.Windows.Forms.Label label4 = new System.Windows.Forms.Label();
		System.Windows.Forms.Label label5 = new System.Windows.Forms.Label();
		System.Windows.Forms.Label label6 = new System.Windows.Forms.Label();
		System.Windows.Forms.Label label7 = new System.Windows.Forms.Label();
		System.Windows.Forms.Label label8 = new System.Windows.Forms.Label();
		System.Windows.Forms.Label label9 = new System.Windows.Forms.Label();
		System.Windows.Forms.Label label10 = new System.Windows.Forms.Label();
		System.Windows.Forms.Label label11 = new System.Windows.Forms.Label();
		System.Windows.Forms.Label label12 = new System.Windows.Forms.Label();
		System.Windows.Forms.Label label13 = new System.Windows.Forms.Label();
		this.GroupBox1.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.RGBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.VehiculosDataSet).BeginInit();
		this.GroupBox2.SuspendLayout();
		this.GroupBox4.SuspendLayout();
		this.GroupBox3.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.DatosDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.FechasBindingSource).BeginInit();
		base.SuspendLayout();
		resources.ApplyResources(label, "IdLabel");
		label.Name = "IdLabel";
		resources.ApplyResources(label2, "Num_IdentificacionLabel");
		label2.Name = "Num_IdentificacionLabel";
		resources.ApplyResources(label3, "MatriculaLabel");
		label3.Name = "MatriculaLabel";
		resources.ApplyResources(label4, "ObservacionesLabel");
		label4.Name = "ObservacionesLabel";
		resources.ApplyResources(label5, "Datos_CargadosLabel");
		label5.Name = "Datos_CargadosLabel";
		resources.ApplyResources(label6, "Fecha_CargaLabel");
		label6.Name = "Fecha_CargaLabel";
		resources.ApplyResources(label7, "IdentificadorLabel");
		label7.Name = "IdentificadorLabel";
		resources.ApplyResources(label8, "Id_DispLabel");
		label8.Name = "Id_DispLabel";
		resources.ApplyResources(label9, "Label4");
		label9.Name = "Label4";
		resources.ApplyResources(label10, "Label5");
		label10.Name = "Label5";
		resources.ApplyResources(label11, "Label6");
		label11.Name = "Label6";
		resources.ApplyResources(label12, "Label7");
		label12.Name = "Label7";
		resources.ApplyResources(label13, "Label8");
		label13.Name = "Label8";
		resources.ApplyResources(this.Button1, "Button1");
		this.Button1.Name = "Button1";
		this.Button1.UseVisualStyleBackColor = true;
		this.GroupBox1.Controls.Add(this.Button3);
		this.GroupBox1.Controls.Add(this.Button2);
		this.GroupBox1.Controls.Add(this.ListBox1);
		resources.ApplyResources(this.GroupBox1, "GroupBox1");
		this.GroupBox1.Name = "GroupBox1";
		this.GroupBox1.TabStop = false;
		resources.ApplyResources(this.Button3, "Button3");
		this.Button3.Name = "Button3";
		this.Button3.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.Button2, "Button2");
		this.Button2.Name = "Button2";
		this.Button2.UseVisualStyleBackColor = true;
		this.ListBox1.DataSource = this.RGBindingSource;
		this.ListBox1.DisplayMember = "Identificador";
		this.ListBox1.FormattingEnabled = true;
		resources.ApplyResources(this.ListBox1, "ListBox1");
		this.ListBox1.Name = "ListBox1";
		this.RGBindingSource.DataMember = "RG";
		this.RGBindingSource.DataSource = this.VehiculosDataSet;
		this.VehiculosDataSet.DataSetName = "VehiculosDataSet";
		this.VehiculosDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.GroupBox2.Controls.Add(this.Button4);
		this.GroupBox2.Controls.Add(this.Label2);
		this.GroupBox2.Controls.Add(this.Label1);
		this.GroupBox2.Controls.Add(this.GroupBox4);
		this.GroupBox2.Controls.Add(this.GroupBox3);
		this.GroupBox2.Controls.Add(label7);
		this.GroupBox2.Controls.Add(this.IdentificadorTextBox);
		this.GroupBox2.Controls.Add(label6);
		this.GroupBox2.Controls.Add(this.Fecha_CargaTextBox);
		this.GroupBox2.Controls.Add(label5);
		this.GroupBox2.Controls.Add(this.Datos_CargadosTextBox);
		this.GroupBox2.Controls.Add(label4);
		this.GroupBox2.Controls.Add(this.ObservacionesTextBox);
		this.GroupBox2.Controls.Add(label3);
		this.GroupBox2.Controls.Add(this.MatriculaTextBox);
		this.GroupBox2.Controls.Add(label2);
		this.GroupBox2.Controls.Add(this.Num_IdentificacionTextBox);
		this.GroupBox2.Controls.Add(label);
		this.GroupBox2.Controls.Add(this.IdTextBox);
		resources.ApplyResources(this.GroupBox2, "GroupBox2");
		this.GroupBox2.Name = "GroupBox2";
		this.GroupBox2.TabStop = false;
		resources.ApplyResources(this.Button4, "Button4");
		this.Button4.Name = "Button4";
		this.Button4.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.Label2, "Label2");
		this.Label2.Name = "Label2";
		resources.ApplyResources(this.Label1, "Label1");
		this.Label1.Name = "Label1";
		this.GroupBox4.Controls.Add(this.Config_2ComboBox);
		resources.ApplyResources(this.GroupBox4, "GroupBox4");
		this.GroupBox4.Name = "GroupBox4";
		this.GroupBox4.TabStop = false;
		this.Config_2ComboBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource, "Config_2", true));
		this.Config_2ComboBox.FormattingEnabled = true;
		this.Config_2ComboBox.Items.AddRange(new object[4]
		{
			resources.GetString("Config_2ComboBox.Items"),
			resources.GetString("Config_2ComboBox.Items1"),
			resources.GetString("Config_2ComboBox.Items2"),
			resources.GetString("Config_2ComboBox.Items3")
		});
		resources.ApplyResources(this.Config_2ComboBox, "Config_2ComboBox");
		this.Config_2ComboBox.Name = "Config_2ComboBox";
		this.GroupBox3.Controls.Add(this.Config_1ComboBox);
		resources.ApplyResources(this.GroupBox3, "GroupBox3");
		this.GroupBox3.Name = "GroupBox3";
		this.GroupBox3.TabStop = false;
		this.Config_1ComboBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource, "Config_1", true));
		this.Config_1ComboBox.FormattingEnabled = true;
		this.Config_1ComboBox.Items.AddRange(new object[4]
		{
			resources.GetString("Config_1ComboBox.Items"),
			resources.GetString("Config_1ComboBox.Items1"),
			resources.GetString("Config_1ComboBox.Items2"),
			resources.GetString("Config_1ComboBox.Items3")
		});
		resources.ApplyResources(this.Config_1ComboBox, "Config_1ComboBox");
		this.Config_1ComboBox.Name = "Config_1ComboBox";
		this.IdentificadorTextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource, "Identificador", true));
		resources.ApplyResources(this.IdentificadorTextBox, "IdentificadorTextBox");
		this.IdentificadorTextBox.Name = "IdentificadorTextBox";
		this.Fecha_CargaTextBox.BackColor = System.Drawing.Color.White;
		this.Fecha_CargaTextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource, "Fecha_Carga", true));
		resources.ApplyResources(this.Fecha_CargaTextBox, "Fecha_CargaTextBox");
		this.Fecha_CargaTextBox.Name = "Fecha_CargaTextBox";
		this.Fecha_CargaTextBox.ReadOnly = true;
		this.Datos_CargadosTextBox.BackColor = System.Drawing.Color.White;
		this.Datos_CargadosTextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource, "Datos_Cargados", true));
		resources.ApplyResources(this.Datos_CargadosTextBox, "Datos_CargadosTextBox");
		this.Datos_CargadosTextBox.Name = "Datos_CargadosTextBox";
		this.Datos_CargadosTextBox.ReadOnly = true;
		this.ObservacionesTextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource, "Observaciones", true));
		resources.ApplyResources(this.ObservacionesTextBox, "ObservacionesTextBox");
		this.ObservacionesTextBox.Name = "ObservacionesTextBox";
		this.MatriculaTextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource, "Matricula", true));
		resources.ApplyResources(this.MatriculaTextBox, "MatriculaTextBox");
		this.MatriculaTextBox.Name = "MatriculaTextBox";
		this.Num_IdentificacionTextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource, "Num_Identificacion", true));
		resources.ApplyResources(this.Num_IdentificacionTextBox, "Num_IdentificacionTextBox");
		this.Num_IdentificacionTextBox.Name = "Num_IdentificacionTextBox";
		this.IdTextBox.BackColor = System.Drawing.Color.White;
		this.IdTextBox.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		this.IdTextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource, "Id", true));
		resources.ApplyResources(this.IdTextBox, "IdTextBox");
		this.IdTextBox.Name = "IdTextBox";
		this.IdTextBox.ReadOnly = true;
		this.RGTableAdapter.ClearBeforeFill = true;
		this.TableAdapterManager.BackupDataSetBeforeUpdate = false;
		this.TableAdapterManager.RGTableAdapter = this.RGTableAdapter;
		this.TableAdapterManager.UpdateOrder = IncliGraph_V1._1_Pro.VehiculosDataSetTableAdapters.TableAdapterManager.UpdateOrderOption.InsertUpdateDelete;
		resources.ApplyResources(this.Label3, "Label3");
		this.Label3.Name = "Label3";
		this.ListBox2.FormattingEnabled = true;
		resources.ApplyResources(this.ListBox2, "ListBox2");
		this.ListBox2.Name = "ListBox2";
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
		this.TextBox1.BackColor = System.Drawing.Color.White;
		resources.ApplyResources(this.TextBox1, "TextBox1");
		this.TextBox1.Name = "TextBox1";
		this.TextBox1.ReadOnly = true;
		this.TextBox2.BackColor = System.Drawing.Color.White;
		resources.ApplyResources(this.TextBox2, "TextBox2");
		this.TextBox2.Name = "TextBox2";
		this.TextBox2.ReadOnly = true;
		this.TextBox3.BackColor = System.Drawing.Color.White;
		resources.ApplyResources(this.TextBox3, "TextBox3");
		this.TextBox3.Name = "TextBox3";
		this.TextBox3.ReadOnly = true;
		this.TextBox4.BackColor = System.Drawing.Color.White;
		resources.ApplyResources(this.TextBox4, "TextBox4");
		this.TextBox4.Name = "TextBox4";
		this.TextBox4.ReadOnly = true;
		this.TextBox5.BackColor = System.Drawing.Color.White;
		resources.ApplyResources(this.TextBox5, "TextBox5");
		this.TextBox5.Name = "TextBox5";
		this.TextBox5.ReadOnly = true;
		this.TextBox6.BackColor = System.Drawing.Color.White;
		resources.ApplyResources(this.TextBox6, "TextBox6");
		this.TextBox6.Name = "TextBox6";
		this.TextBox6.ReadOnly = true;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.TextBox6);
		base.Controls.Add(this.TextBox5);
		base.Controls.Add(label13);
		base.Controls.Add(label12);
		base.Controls.Add(label11);
		base.Controls.Add(label10);
		base.Controls.Add(label9);
		base.Controls.Add(label8);
		base.Controls.Add(this.TextBox4);
		base.Controls.Add(this.TextBox3);
		base.Controls.Add(this.TextBox2);
		base.Controls.Add(this.TextBox1);
		base.Controls.Add(this.ListBox2);
		base.Controls.Add(this.Label3);
		base.Controls.Add(this.GroupBox2);
		base.Controls.Add(this.GroupBox1);
		base.Controls.Add(this.Button1);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.Fixed3D;
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "Base_Datos";
		base.ShowIcon = false;
		this.GroupBox1.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.RGBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.VehiculosDataSet).EndInit();
		this.GroupBox2.ResumeLayout(false);
		this.GroupBox2.PerformLayout();
		this.GroupBox4.ResumeLayout(false);
		this.GroupBox3.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.DatosDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.FechasBindingSource).EndInit();
		base.ResumeLayout(false);
		base.PerformLayout();
	}

	private void Base_Datos_FormClosing(object sender, FormClosingEventArgs e)
	{
		Validate();
		RGBindingSource.EndEdit();
		RGTableAdapter.Update(VehiculosDataSet.RG);
		MyProject.Forms.Principal.Visible = true;
	}

	private void Base_Datos_Load(object sender, EventArgs e)
	{
		FechasTableAdapter.Fill(DatosDataSet.Fechas);
		RGTableAdapter.Fill(VehiculosDataSet.RG);
		actualizar();
		base.Width = 670;
	}

	private void actualizar()
	{
		if (RGBindingSource.Count == 0)
		{
			GroupBox2.Enabled = false;
			Button3.Enabled = false;
		}
		else
		{
			GroupBox2.Enabled = true;
			Button3.Enabled = true;
		}
	}

	private void actualizar_casillas()
	{
		if (Operators.CompareString(VehiculosDataSet.RG[RGBindingSource.Position].Datos_Cargados, "Datos sin cargar", TextCompare: false) == 0)
		{
			Datos_CargadosTextBox.ForeColor = Color.Red;
		}
		else
		{
			Datos_CargadosTextBox.ForeColor = Color.Black;
		}
	}

	private void Button2_Click(object sender, EventArgs e)
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
				dataRow[9] = "Vehículo RG 1";
			}
			else
			{
				dataRow[0] = Conversions.ToDouble(VehiculosDataSet.RG[RGBindingSource.Position].Id) + 1.0;
				dataRow[9] = "Vehículo RG " + Conversions.ToString(Conversions.ToDouble(VehiculosDataSet.RG[RGBindingSource.Position].Id) + 1.0);
			}
			dataRow[1] = "0";
			dataRow[2] = "";
			dataRow[3] = "";
			dataRow[4] = "";
			dataRow[5] = "";
			dataRow[6] = "Datos sin cargar";
			dataRow[7] = "Datos sin cargar";
			dataRow[8] = "";
			rows.Add(dataRow);
			Validate();
			RGBindingSource.EndEdit();
			RGTableAdapter.Update(VehiculosDataSet.RG);
			RGBindingSource.Position = RGBindingSource.Count - 1;
			actualizar();
			actualizar_casillas();
		}
	}

	private void Button3_Click(object sender, EventArgs e)
	{
		string newLine = Environment.NewLine;
		if (Operators.CompareString(VehiculosDataSet.RG[RGBindingSource.Position].Datos_Cargados, "Datos cargados", TextCompare: false) == 0)
		{
			Interaction.MsgBox("No se puede borrar este vehículo, ya ha cargado sus datos en un dispositivo.");
		}
		else if (RGBindingSource.Count != 0 && MessageBox.Show("¿Desea borrar este vehículo?" + newLine, "Borrar", MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)
		{
			NewLateBinding.LateCall(NewLateBinding.LateGet(RGBindingSource.Current, null, "row", new object[0], null, null, null), null, "delete", new object[0], null, null, null, IgnoreReturn: true);
			Validate();
			RGBindingSource.EndEdit();
			RGTableAdapter.Update(VehiculosDataSet.RG);
			actualizar();
			actualizar_casillas();
		}
	}

	private void Button1_Click(object sender, EventArgs e)
	{
		Close();
	}

	private void IdentificadorTextBox_KeyPress(object sender, KeyPressEventArgs e)
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

	private void Num_IdentificacionTextBox_KeyPress(object sender, KeyPressEventArgs e)
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

	private void MatriculaTextBox_KeyPress(object sender, KeyPressEventArgs e)
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

	private void Config_1ComboBox_KeyUp(object sender, KeyEventArgs e)
	{
		Config_1ComboBox.SelectedIndex = 0;
	}

	private void Config_2ComboBox_KeyUp(object sender, KeyEventArgs e)
	{
		Config_2ComboBox.SelectedIndex = 0;
	}

	private void Button4_Click(object sender, EventArgs e)
	{
		if (desplegado == 0)
		{
			base.Width = 965;
			Button4.Text = "Ocultar Historial de Cargas";
			desplegado = 1;
		}
		else
		{
			base.Width = 670;
			Button4.Text = "Ver Historial de Cargas";
			desplegado = 0;
		}
	}

	private void ListBox1_SelectedIndexChanged(object sender, EventArgs e)
	{
		actualizar_cargas();
	}

	private void actualizar_cargas()
	{
		int num = Conversions.ToInteger(VehiculosDataSet.RG[ListBox1.SelectedIndex].Id);
		string filterExpression = "ID_RG like '" + Conversions.ToString(num) + "'";
		Lista_cargas = DatosDataSet.Fechas.Select(filterExpression);
		if (Lista_cargas.GetUpperBound(0) == -1)
		{
			ListBox2.Items.Clear();
			ListBox2.Items.Add("No se han cargado datos.");
		}
		else
		{
			ListBox2.Items.Clear();
			int upperBound = Lista_cargas.GetUpperBound(0);
			for (int i = 0; i <= upperBound; i = checked(i + 1))
			{
				string item = Conversions.ToString(Operators.ConcatenateObject("Fecha - ", Lista_cargas[i][1]));
				ListBox2.Items.Add(item);
			}
		}
		_ = FechasBindingSource.Count;
	}

	private void actualizar_casillas_cargas()
	{
		if (Operators.ConditionalCompareObjectEqual(ListBox2.SelectedItem, "No se han cargado datos.", TextCompare: false))
		{
			TextBox6.Text = "";
			TextBox1.Text = "";
			TextBox2.Text = "";
			TextBox3.Text = "";
			TextBox4.Text = "";
			TextBox5.Text = "";
		}
		else
		{
			TextBox6.Text = Conversions.ToString(Lista_cargas[ListBox2.SelectedIndex][4]);
			TextBox1.Text = Conversions.ToString(Lista_cargas[ListBox2.SelectedIndex][1]);
			TextBox2.Text = Conversions.ToString(Lista_cargas[ListBox2.SelectedIndex][2]);
			TextBox3.Text = Conversions.ToString(Lista_cargas[ListBox2.SelectedIndex][5]);
			TextBox4.Text = Conversions.ToString(Lista_cargas[ListBox2.SelectedIndex][6]);
			TextBox5.Text = Conversions.ToString(Lista_cargas[ListBox2.SelectedIndex][7]);
		}
	}

	private void ListBox2_SelectedIndexChanged(object sender, EventArgs e)
	{
		actualizar_casillas_cargas();
	}
}
