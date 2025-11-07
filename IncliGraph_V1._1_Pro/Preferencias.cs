using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Reflection;
using System.Resources;
using System.Runtime.CompilerServices;
using System.Windows.Forms;
using IncliGraph_V1._1_Pro.My;
using Microsoft.VisualBasic.CompilerServices;

namespace IncliGraph_V1._1_Pro;

[DesignerGenerated]
public class Preferencias : Form
{
	private IContainer components;

	[CompilerGenerated]
	[AccessedThroughProperty("Button1")]
	private Button _Button1;

	[CompilerGenerated]
	[AccessedThroughProperty("Button2")]
	private Button _Button2;

	[CompilerGenerated]
	[AccessedThroughProperty("Button3")]
	private Button _Button3;

	private string Ruta_nueva;

	private int cerrar_ref;

	private ResourceManager RM;

	[field: AccessedThroughProperty("Label1")]
	internal virtual Label Label1
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

	[field: AccessedThroughProperty("Label2")]
	internal virtual Label Label2
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

	public Preferencias()
	{
		base.FormClosing += Preferencias_FormClosing;
		base.Load += Preferencias_Load;
		cerrar_ref = 0;
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
		System.ComponentModel.ComponentResourceManager componentResourceManager = new System.ComponentModel.ComponentResourceManager(typeof(IncliGraph_V1._1_Pro.Preferencias));
		this.Label1 = new System.Windows.Forms.Label();
		this.TextBox1 = new System.Windows.Forms.TextBox();
		this.Button1 = new System.Windows.Forms.Button();
		this.Button2 = new System.Windows.Forms.Button();
		this.Button3 = new System.Windows.Forms.Button();
		this.Label2 = new System.Windows.Forms.Label();
		this.Label3 = new System.Windows.Forms.Label();
		base.SuspendLayout();
		componentResourceManager.ApplyResources(this.Label1, "Label1");
		this.Label1.Name = "Label1";
		componentResourceManager.ApplyResources(this.TextBox1, "TextBox1");
		this.TextBox1.Name = "TextBox1";
		componentResourceManager.ApplyResources(this.Button1, "Button1");
		this.Button1.Name = "Button1";
		this.Button1.UseVisualStyleBackColor = true;
		componentResourceManager.ApplyResources(this.Button2, "Button2");
		this.Button2.Name = "Button2";
		this.Button2.UseVisualStyleBackColor = true;
		componentResourceManager.ApplyResources(this.Button3, "Button3");
		this.Button3.Name = "Button3";
		this.Button3.UseVisualStyleBackColor = true;
		componentResourceManager.ApplyResources(this.Label2, "Label2");
		this.Label2.Name = "Label2";
		componentResourceManager.ApplyResources(this.Label3, "Label3");
		this.Label3.Name = "Label3";
		componentResourceManager.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.Button3);
		base.Controls.Add(this.Button2);
		base.Controls.Add(this.Button1);
		base.Controls.Add(this.TextBox1);
		base.Controls.Add(this.Label3);
		base.Controls.Add(this.Label2);
		base.Controls.Add(this.Label1);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedToolWindow;
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "Preferencias";
		base.ShowIcon = false;
		base.ResumeLayout(false);
		base.PerformLayout();
	}

	private void Preferencias_FormClosing(object sender, FormClosingEventArgs e)
	{
		if (cerrar_ref == 1)
		{
			MyProject.Forms.Principal.ruta_nueva = Ruta_nueva;
			MyProject.Forms.Principal.Guardar_ruta();
		}
	}

	private void Preferencias_Load(object sender, EventArgs e)
	{
		TextBox1.Text = MyProject.Forms.Principal.ruta_raiz;
	}

	private void Button2_Click(object sender, EventArgs e)
	{
		cerrar_ref = 1;
		Close();
	}

	private void Button3_Click(object sender, EventArgs e)
	{
		Close();
	}

	private void Button1_Click(object sender, EventArgs e)
	{
		string newLine = Environment.NewLine;
		FolderBrowserDialog folderBrowserDialog = new FolderBrowserDialog();
		folderBrowserDialog.RootFolder = Environment.SpecialFolder.Desktop;
		folderBrowserDialog.ShowNewFolderButton = true;
		folderBrowserDialog.Description = RM.GetString("seleccione1") + newLine + RM.GetString("seleccione2");
		if (folderBrowserDialog.ShowDialog() == DialogResult.OK)
		{
			Ruta_nueva = folderBrowserDialog.SelectedPath;
			TextBox1.Text = Ruta_nueva;
		}
	}
}
